#!/usr/bin/env bash
# Phase 2 CMS E2E: upload → pipeline → review → approve → save
# Polls .cms pipeline.json (cheap) instead of hammering /api/cms/history.
set -euo pipefail
cd "$(dirname "$0")/../.."
BASE="http://127.0.0.1:3000"
PDF="scripts/cms-reliability/fixtures/jbig2-al-402.pdf"
NATIVE="scripts/cms-reliability/fixtures/native-text-al402-sample.pdf"
IMG=".cms/uploads/job_11e88aa0499747b08cc8e8c6003f4d03/original.webp"
REPORT="/tmp/hlt-cms-e2e-report.json"
LOG="/tmp/hlt-cms-e2e.log"
: > "$LOG"

log() { echo "$@" | tee -a "$LOG" >&2; }

# Echo ONLY the terminal stage on stdout (for capture). Logs go to stderr/file.
poll_job() {
  local jobId="$1"
  local max="${2:-60}"
  local i=0
  local stage=""
  local status=""
  local pipe=".cms/uploads/${jobId}/pipeline.json"
  while [ "$i" -lt "$max" ]; do
    i=$((i+1))
    if [ -f "$pipe" ]; then
      stage=$(node -e "const fs=require('fs');try{const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(j.stage||'')}catch{console.log('')}" "$pipe")
      status=$(node -e "const fs=require('fs');try{const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(j.status||'')}catch{console.log('')}" "$pipe")
    else
      stage=""; status=""
    fi
    echo "poll#$i job=$jobId stage=$stage status=$status" >> "$LOG"
    case "$stage" in
      WRITTEN|UNDER_REVIEW|APPROVED|LOCAL_SAVED|FAILED|TIMEOUT|CANCELLED|written|under_review|approved|local_saved|failed)
        echo "$stage"; return 0 ;;
    esac
    case "$status" in
      awaiting_review|approved|failed|completed) echo "$stage"; return 0 ;;
    esac
    sleep 5
  done
  echo "timeout"
  return 1
}

log "=== TEST A: scanned PDF (JBIG2) ==="
UP=$(curl -s -X POST "$BASE/api/cms/upload" \
  -F "file=@${PDF};type=application/pdf" \
  -F "type=pyq" \
  -F "branch=aiml" \
  -F "semester=4" \
  -F "subjectCode=AL-402" \
  -F "year=2025" \
  -F "examSession=June" \
  -F "uploadMode=normal_pdf" \
  -F "paperCount=1" \
  -F "autoPipeline=true")
log "upload=$UP"
JOB=$(echo "$UP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.job?.id||j.jobId||'')})")
if [ -z "$JOB" ]; then log "PDF upload FAIL"; exit 1; fi
log "PDF_JOB=$JOB"
STAGE=$(poll_job "$JOB" 48 || true)
log "PDF pipeline terminal stage=$STAGE"

SAVE_EARLY=$(curl -s -X POST "$BASE/api/cms/save" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB\"}")
log "save_before_approve=$SAVE_EARLY"

REV=$(curl -s -X POST "$BASE/api/cms/review" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB\",\"action\":\"start\"}")
log "review_start=$REV"
APR=$(curl -s -X POST "$BASE/api/cms/review" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB\",\"action\":\"decide\",\"decision\":\"approve\",\"note\":\"phase2 e2e\"}")
log "approve=$APR"
SAVE=$(curl -s -X POST "$BASE/api/cms/save" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB\"}")
log "save=$SAVE"

log "=== TEST B: native PDF ==="
UPN=$(curl -s -X POST "$BASE/api/cms/upload" \
  -F "file=@${NATIVE};type=application/pdf" \
  -F "type=pyq" \
  -F "branch=aiml" \
  -F "semester=4" \
  -F "subjectCode=AL-402" \
  -F "year=2025" \
  -F "examSession=June" \
  -F "uploadMode=normal_pdf" \
  -F "paperCount=1" \
  -F "autoPipeline=true")
log "native_upload=$UPN"
JOBN=$(echo "$UPN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.job?.id||'')})")
log "NATIVE_JOB=$JOBN"
STAGEN=$(poll_job "$JOBN" 36 || true)
log "NATIVE terminal=$STAGEN"
REVN=$(curl -s -X POST "$BASE/api/cms/review" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOBN\",\"action\":\"start\"}")
APRN=$(curl -s -X POST "$BASE/api/cms/review" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOBN\",\"action\":\"decide\",\"decision\":\"approve\",\"note\":\"native e2e\"}")
SAVEN=$(curl -s -X POST "$BASE/api/cms/save" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOBN\"}")
log "native_save=$SAVEN"

log "=== TEST C: Image ==="
UP2=$(curl -s -X POST "$BASE/api/cms/upload" \
  -F "file=@${IMG};type=image/webp" \
  -F "type=pyq" \
  -F "branch=cscy" \
  -F "semester=3" \
  -F "subjectCode=CY-301" \
  -F "year=2025" \
  -F "examSession=June" \
  -F "uploadMode=images" \
  -F "paperCount=1" \
  -F "autoPipeline=true")
log "img_upload=$UP2"
JOB2=$(echo "$UP2" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.job?.id||'')})")
log "IMG_JOB=$JOB2"
STAGE2=$(poll_job "$JOB2" 48 || true)
log "IMG terminal=$STAGE2"
REV2=$(curl -s -X POST "$BASE/api/cms/review" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB2\",\"action\":\"start\"}")
APR2=$(curl -s -X POST "$BASE/api/cms/review" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB2\",\"action\":\"decide\",\"decision\":\"approve\",\"note\":\"image e2e\"}")
SAVE2=$(curl -s -X POST "$BASE/api/cms/save" -H 'Content-Type: application/json' -d "{\"jobId\":\"$JOB2\"}")
log "img_save=$SAVE2"

log "=== TEST E: Input limits ==="
MERGED=$(curl -s -X POST "$BASE/api/cms/upload" \
  -F "file=@${PDF};type=application/pdf" \
  -F "type=pyq" -F "branch=aiml" -F "semester=4" -F "subjectCode=AL-402" \
  -F "uploadMode=merged_pdf" -F "paperCount=1" -F "autoPipeline=false")
log "merged_reject=$MERGED"
MULTI=$(curl -s -X POST "$BASE/api/cms/upload" \
  -F "file=@${PDF};type=application/pdf" \
  -F "type=pyq" -F "branch=aiml" -F "semester=4" -F "subjectCode=AL-402" \
  -F "uploadMode=normal_pdf" -F "paperCount=2" -F "autoPipeline=false")
log "multipaper_reject=$MULTI"
IMG_ARGS=()
for i in 1 2 3 4 5 6; do IMG_ARGS+=(-F "files=@${IMG};type=image/webp"); done
SIX=$(curl -s -X POST "$BASE/api/cms/upload" \
  "${IMG_ARGS[@]}" \
  -F "type=pyq" -F "branch=cscy" -F "semester=3" -F "subjectCode=CY-301" \
  -F "uploadMode=images" -F "paperCount=1" -F "autoPipeline=false")
log "six_images_reject=$SIX"

log "=== DONE ==="
{
  echo "PDF_JOB=$JOB STAGE=$STAGE SAVE=$SAVE"
  echo "NATIVE_JOB=$JOBN STAGE=$STAGEN SAVE=$SAVEN"
  echo "IMG_JOB=$JOB2 STAGE=$STAGE2 SAVE=$SAVE2"
} | tee "$REPORT"
