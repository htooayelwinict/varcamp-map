#!/usr/bin/env bash
# Build, verify, prepare and (only with --apply) upload the VarCamp demo release
# straight from this devbox. Git is version control only: there is no CI, PR or
# GitHub Pages step. Credentials stay inside the private environment file and are
# never echoed by this script.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: npm run deploy:demo -- [options]      (or: bash ops/deploy-demo.sh [options])

Builds the complete map release on this devbox, prepares a live-preserving upload
plan with ops/release_upload.py and, only with --apply, uploads that plan and runs
the live acceptance smoke test.

Options:
  --target <id>          Map-storage directory to release into (default: varcamp-demo)
  --environment <path>   Private environment file holding MAPS_HOST/UPLOAD_USER/UPLOAD_PASSWORD
                         (default: /srv/varcamp/private/environment)
  --plan <dir>           New plan directory; must not exist yet
                         (default: .qa/release-<UTC yyyymmdd-HHMM>)
  --with-tests           Run `npm run test:node` and then
                         `npm test -- --maxWorkers=1 --testTimeout=30000` before building.
                         Any failure aborts the deploy.
  --auditorium-spacing   Move the three owned zones in each zodiac room to the expanded layout.
  --office-wings        Append four side-wing areas to each zodiac room; retain saved editor data.
  --organizer-meetings  Enable shared meetings in the twelve existing organizer offices.
  --reset-sagittarius-organizer Remove the reviewed manual lock/highlight settings from that office.
  --enchanted-exploration Replace the five reviewed exploration area sets; retain other editor data.
  --apply                After prepare: upload the plan (--quiet-editor-window) and run
                         `npm run acceptance:smoke`. Without it the script stops after
                         prepare and prints how to inspect and apply the plan.
  -h, --help             Show this help

Sequence: node version check -> [tests] -> maps:validate -> buildmap -> verify-source
          -> migrate_wam_tokens -> release_upload prepare -> [release_upload apply -> smoke]
EOF
}

target='varcamp-demo'
environment='/srv/varcamp/private/environment'
plan=".qa/release-$(date -u +%Y%m%d-%H%M)"
with_tests=0
apply=0
wam_options=()

while [ $# -gt 0 ]; do
  case "$1" in
    --target) [ $# -ge 2 ] || { echo "--target needs a value" >&2; exit 2; }; target="$2"; shift 2 ;;
    --environment) [ $# -ge 2 ] || { echo "--environment needs a value" >&2; exit 2; }; environment="$2"; shift 2 ;;
    --plan) [ $# -ge 2 ] || { echo "--plan needs a value" >&2; exit 2; }; plan="$2"; shift 2 ;;
    --with-tests) with_tests=1; shift ;;
    --apply) apply=1; shift ;;
    --auditorium-spacing) wam_options+=(--auditorium-spacing); shift ;;
    --office-wings) wam_options+=(--office-wings); shift ;;
    --organizer-meetings) wam_options+=(--organizer-meetings); shift ;;
    --reset-sagittarius-organizer) wam_options+=(--reset-sagittarius-organizer); shift ;;
    --enchanted-exploration) wam_options+=(--enchanted-exploration); shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

step() { printf '\n==> %s\n' "$*"; }

step "Node toolchain"
if [ -d "$HOME/.local/share/fnm" ]; then export PATH="$HOME/.local/share/fnm:$PATH"; fi
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
  fnm use "$(tr -d '[:space:]' < .nvmrc)" >/dev/null
fi
required_node="v$(tr -d '[:space:]' < .nvmrc)"
actual_node="$(node -v)"
echo "node $actual_node (required $required_node from .nvmrc)"
if [ "$actual_node" != "$required_node" ]; then
  echo "Node $actual_node does not match .nvmrc $required_node; run: fnm install $(tr -d '[:space:]' < .nvmrc)" >&2
  exit 1
fi
[ -f "$environment" ] || { echo "Environment file not found: $environment" >&2; exit 1; }
[ ! -e "$plan" ] || { echo "Plan directory already exists: $plan (release_upload.py refuses to overwrite a retained plan)" >&2; exit 1; }

if [ "$with_tests" = 1 ]; then
  step "Native Node suites"
  npm run test:node
  step "Vitest suites"
  npm test -- --maxWorkers=1 --testTimeout=30000
fi

step "Validate native maps"
npm run maps:validate

step "Build the complete map release"
npm run buildmap

step "Verify the frozen source snapshot"
node publication/verify-source.mjs .

step "Prepare reviewed WAM migrations for live maps"
# release_upload.py creates the plan directory itself and refuses an existing one,
# so the reviewed archive is staged in a private temp directory and moved into the
# plan once prepare has created it.
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT
python3 ops/migrate_wam_tokens.py --target "$target" --environment "$environment" --out "$staging/reviewed-wams.zip" "${wam_options[@]}"

step "Prepare the live-preserving release plan"
mkdir -p "$(dirname "$plan")"
python3 ops/release_upload.py prepare --target "$target" --plan "$plan" --environment "$environment" --reviewed-wams "$staging/reviewed-wams.zip"
mv "$staging/reviewed-wams.zip" "$plan/reviewed-wams.zip"

step "Plan summary ($plan/plan.json)"
python3 -I - "$plan/plan.json" <<'EOF'
import json, sys
plan = json.load(open(sys.argv[1]))
deps = plan['wamDependencies']
print(json.dumps({
    'target': plan['target'],
    'baselineFiles': len(plan['baseline']),
    'uploadFiles': len(plan['package']),
    'expectedLiveFiles': len(plan['expected']),
    'pairedWams': len(deps),
    'reviewedWams': len(plan['reviewedWams']),
    'preservedWams': len(plan['preservedWams']),
    'reviewedMigrations': sorted(path for path, row in deps.items() if row['reviewed']),
}, indent=2))
EOF

if [ "$apply" != 1 ]; then
  cat <<EOF

Prepared only (no upload). Inspect the plan before applying:
  less $plan/plan.json
  unzip -l $plan/package.zip
  unzip -l $plan/reviewed-wams.zip

Apply this exact plan after confirming a quiet editor window:
  python3 ops/release_upload.py apply --plan $plan --environment $environment --quiet-editor-window
  npm run acceptance:smoke

Or rebuild and apply in one run:
  bash ops/deploy-demo.sh --target $target --environment $environment --apply
EOF
  exit 0
fi

step "Apply the release (quiet editor window confirmed by --apply)"
python3 ops/release_upload.py apply --plan "$plan" --environment "$environment" --quiet-editor-window

step "Live acceptance smoke test"
smoke_status=0
npm run --silent acceptance:smoke -- --out "$plan/smoke" > "$plan/smoke.json" 2> "$plan/smoke.stderr.log" || smoke_status=$?
smoke_ok="$(python3 -I - "$plan/smoke.json" <<'EOF' || true
import json, sys
text = open(sys.argv[1]).read()
start = text.find('{')
print(json.loads(text[start:]).get('ok') if start >= 0 else 'unknown')
EOF
)"
echo "smoke ok: ${smoke_ok:-unknown} (exit $smoke_status; details in $plan/smoke.json and $plan/smoke.stderr.log)"
if [ "$smoke_status" != 0 ] || [ "$smoke_ok" != "True" ]; then
  echo "WARNING: the live smoke test did not pass; the upload itself completed. Review before announcing the release." >&2
fi

step "Done: release applied from plan $plan"
