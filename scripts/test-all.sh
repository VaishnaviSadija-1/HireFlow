#!/bin/bash
set -uo pipefail

BASE="http://localhost:3000"
PASS=0
FAIL=0
FAILURES=""

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

check() {
  local name="$1" result="$2" expected="$3"
  if [[ "$result" == *"$expected"* ]]; then
    echo -e "${GREEN}✓${NC} $name"; ((PASS++))
  else
    echo -e "${RED}✗${NC} $name  →  got: ${result:0:100}"
    ((FAIL++)); FAILURES="$FAILURES\n  - $name"
  fi
}

check_http() {
  local name="$1" url="$2" expected_code="$3"
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [[ "$code" == "$expected_code" ]]; then
    echo -e "${GREEN}✓${NC} $name (HTTP $code)"; ((PASS++))
  else
    echo -e "${RED}✗${NC} $name  →  expected $expected_code got $code"
    ((FAIL++)); FAILURES="$FAILURES\n  - $name (expected $expected_code got $code)"
  fi
}

check_file() {
  if [[ -f "$1" ]]; then
    echo -e "${GREEN}✓${NC} exists: $1"; ((PASS++))
  else
    echo -e "${RED}✗${NC} MISSING: $1"
    ((FAIL++)); FAILURES="$FAILURES\n  - Missing: $1"
  fi
}

# ───────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  HireFlow — Full Test Suite"
echo "══════════════════════════════════════════"

# AUTH / ROUTING
echo ""
echo "[ AUTH & ROUTING ]"
check_http "Login page loads"                    "$BASE/login"           "200"
check_http "Dashboard → redirects unauth"        "$BASE/"                "307"
check_http "Employees → redirects unauth"        "$BASE/employees"       "307"
check_http "Recruitment → redirects unauth"      "$BASE/recruitment"     "307"
check_http "Analytics → redirects unauth"        "$BASE/analytics"       "307"
check_http "Leave → redirects unauth"            "$BASE/leave"           "307"
check_http "PolicyBot → redirects unauth"        "$BASE/policybot"       "307"
check_http "AgentOps → redirects unauth"         "$BASE/admin/agentops"  "307"

# API UNAUTHENTICATED BLOCKS
echo ""
echo "[ API — BLOCKS UNAUTHENTICATED ]"
check "GET /api/employees"              "$(curl -s $BASE/api/employees)"               "Unauthorized"
check "GET /api/departments"            "$(curl -s $BASE/api/departments)"             "Unauthorized"
check "GET /api/recruitment/jobs"       "$(curl -s $BASE/api/recruitment/jobs)"        "Unauthorized"
check "GET /api/leave/requests"         "$(curl -s $BASE/api/leave/requests)"          "Unauthorized"
check "GET /api/leave/balance"          "$(curl -s $BASE/api/leave/balance)"           "Unauthorized"
check "GET /api/analytics/overview"     "$(curl -s $BASE/api/analytics/overview)"      "Unauthorized"
check "GET /api/policybot/tickets"      "$(curl -s $BASE/api/policybot/tickets)"       "Unauthorized"
check "GET /api/admin/agentops"         "$(curl -s $BASE/api/admin/agentops)"          "Unauthorized"

# DATABASE INTEGRITY
echo ""
echo "[ DATABASE — SEED INTEGRITY ]"
DB_STATS=$(npx tsx scripts/db-stats.ts 2>/dev/null | grep '^{' || echo '{}')

check "4 users seeded"              "$DB_STATS" '"u":4'
check "12 employees seeded"         "$DB_STATS" '"e":12'
check "2 jobs seeded"               "$DB_STATS" '"j":2'
check "5 candidates seeded"         "$DB_STATS" '"c":5'
check "3 policy documents seeded"   "$DB_STATS" '"pd":3'
check "Leave requests seeded"       "$DB_STATS" '"lr":'
check "36 leave balances seeded"    "$DB_STATS" '"lb":36'
check "Tickets seeded"              "$DB_STATS" '"t":'

# API ROUTES EXIST
echo ""
echo "[ API ROUTES ]"
check_file "app/api/employees/route.ts"
check_file "app/api/employees/[id]/route.ts"
check_file "app/api/departments/route.ts"
check_file "app/api/recruitment/jobs/route.ts"
check_file "app/api/recruitment/jobs/[id]/route.ts"
check_file "app/api/recruitment/candidates/route.ts"
check_file "app/api/recruitment/candidates/upload/route.ts"
check_file "app/api/recruitment/candidates/[id]/route.ts"
check_file "app/api/recruitment/bias/route.ts"
check_file "app/api/leave/requests/route.ts"
check_file "app/api/leave/requests/[id]/route.ts"
check_file "app/api/leave/balance/route.ts"
check_file "app/api/policybot/chat/route.ts"
check_file "app/api/policybot/upload/route.ts"
check_file "app/api/policybot/tickets/route.ts"
check_file "app/api/policybot/tickets/[id]/route.ts"
check_file "app/api/analytics/overview/route.ts"
check_file "app/api/admin/agentops/route.ts"

# PAGES EXIST
echo ""
echo "[ PAGES ]"
check_file "app/(auth)/login/page.tsx"
check_file "app/(dashboard)/page.tsx"
check_file "app/(dashboard)/layout.tsx"
check_file "app/(dashboard)/employees/page.tsx"
check_file "app/(dashboard)/employees/[id]/page.tsx"
check_file "app/(dashboard)/employees/org-chart/page.tsx"
check_file "app/(dashboard)/recruitment/page.tsx"
check_file "app/(dashboard)/recruitment/new/page.tsx"
check_file "app/(dashboard)/recruitment/[id]/page.tsx"
check_file "app/(dashboard)/policybot/page.tsx"
check_file "app/(dashboard)/analytics/page.tsx"
check_file "app/(dashboard)/leave/page.tsx"
check_file "app/(dashboard)/leave/calendar/page.tsx"
check_file "app/(dashboard)/admin/agentops/page.tsx"

# COMPONENTS EXIST
echo ""
echo "[ COMPONENTS ]"
check_file "components/layout/Sidebar.tsx"
check_file "components/employees/AddEmployeeSheet.tsx"
check_file "components/leave/ApprovalActions.tsx"
check_file "components/leave/LeaveRequestForm.tsx"
check_file "components/leave/LeaveRequestTable.tsx"
check_file "components/leave/LeaveBalanceWidget.tsx"
check_file "components/recruitment/CandidateCard.tsx"
check_file "components/recruitment/CandidateDrawer.tsx"
check_file "components/policybot/ChatInterface.tsx"
check_file "components/policybot/PolicyUpload.tsx"
check_file "components/policybot/TicketList.tsx"
check_file "components/analytics/HiringFunnelChart.tsx"
check_file "components/analytics/FlightRiskTable.tsx"
check_file "components/analytics/DepartmentBreakdown.tsx"
check_file "components/analytics/LeaveOverview.tsx"
check_file "lib/ai/client.ts"
check_file "lib/ai/recruitment.ts"
check_file "lib/ai/policybot.ts"
check_file "lib/ai/analytics.ts"
check_file "lib/agentops/observe.ts"

# CODE QUALITY
echo ""
echo "[ CODE QUALITY ]"
check "Leave approval uses startTransition"  "$(grep -l 'startTransition' components/leave/ApprovalActions.tsx 2>/dev/null)"  "ApprovalActions"
check "Leave page force-dynamic"             "$(grep 'force-dynamic' app/\(dashboard\)/leave/page.tsx 2>/dev/null)"           "force-dynamic"
check "Sidebar links to /admin/agentops"     "$(grep 'admin/agentops' components/layout/Sidebar.tsx 2>/dev/null)"             "admin/agentops"
check "Leave balance validation"             "$(grep 'Insufficient' app/api/leave/requests/route.ts 2>/dev/null)"             "Insufficient"
check "Leave blocks overlapping PENDING"     "$(grep 'PENDING' app/api/leave/requests/route.ts 2>/dev/null)"                  "PENDING"
check "Candidate PDF upload"                 "$(grep -l 'PDFParse\|pdf-parse' app/api/recruitment/candidates/upload/route.ts 2>/dev/null)" "route.ts"
check "Policy PDF upload"                    "$(grep -l 'PDFParse\|pdf-parse' app/api/policybot/upload/route.ts 2>/dev/null)" "route.ts"
check "AgentOps wraps recruitment AI"        "$(grep 'observedAiCall' lib/ai/recruitment.ts 2>/dev/null)"                     "observedAiCall"
check "AgentOps wraps policybot AI"          "$(grep 'observedAiCall' lib/ai/policybot.ts 2>/dev/null)"                       "observedAiCall"
check "AgentOps wraps analytics AI"          "$(grep 'observedAiCall' lib/ai/analytics.ts 2>/dev/null)"                       "observedAiCall"
check "AddEmployeeSheet component"           "$(grep -l 'AddEmployeeSheet' app/\(dashboard\)/employees/page.tsx 2>/dev/null || grep -l 'AddEmployeeButton' app/\(dashboard\)/employees/page.tsx 2>/dev/null)" "page.tsx"

# TYPESCRIPT
echo ""
echo "[ TYPESCRIPT ]"
TS_EXIT=0
TS_OUT=$(node node_modules/typescript/bin/tsc --noEmit 2>&1) || TS_EXIT=$?
if [[ $TS_EXIT -eq 0 ]]; then
  echo -e "${GREEN}✓${NC} TypeScript: 0 errors"; ((PASS++))
else
  echo -e "${RED}✗${NC} TypeScript errors:"
  echo "$TS_OUT" | head -30
  ((FAIL++)); FAILURES="$FAILURES\n  - TypeScript errors"
fi

# SUMMARY
echo ""
echo "══════════════════════════════════════════"
echo -e "  ${GREEN}$PASS passed${NC}   ${RED}$FAIL failed${NC}"
echo "══════════════════════════════════════════"
if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}FAILED TESTS:${NC}$FAILURES"
  exit 1
fi
echo -e "${GREEN}ALL TESTS PASSED ✓${NC}"
exit 0
