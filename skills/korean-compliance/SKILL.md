---
name: korean-compliance
description: >-
  한국 규정 준수 및 개인정보보호 패턴. KISA ISMS-P 인증, 개인정보보호법(PIPA 2024),
  한국표준시(KST) 처리, 한국어 사용자 인터페이스 패턴, NIA AI 윤리 가이드라인을
  적용할 때 사용합니다. 한국 시장을 대상으로 하는 서비스를 구축하거나,
  한국 규정 준수가 필요한 경우 활성화됩니다.
  Korean compliance and privacy patterns. Use when building services targeting
  the Korean market or requiring Korean regulatory compliance including
  KISA ISMS-P, PIPA (Personal Information Protection Act 2024 amendment),
  KST datetime handling, Korean UI patterns, and NIA AI ethics guidelines.
license: SEE LICENSE IN ../../LICENSE
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
  regulation-versions:
    PIPA: "2024 amendment (개인정보보호법 2024년 개정)"
    ISMS-P: "v2.0 (KISA 정보보호 및 개인정보보호 관리체계)"
---

# 한국 규정 준수 (Korean Compliance)

한국 시장을 대상으로 하는 서비스를 구축할 때 필요한 규정 준수, 개인정보보호, 현지화 규칙을 제공합니다. 규칙은 영향도 순으로 정렬됩니다: CRITICAL은 법적 위반을 방지하고, HIGH는 일반적인 규정 위반을 방지하며, MEDIUM은 사용자 경험을 개선합니다.

This skill provides compliance, privacy, and localization rules for services targeting the Korean market. Rules are ordered by impact: CRITICAL rules prevent legal violations; HIGH rules prevent common compliance issues; MEDIUM rules improve user experience.

> **규정 버전 참고:** 이 스킬은 PIPA 2024년 개정 및 ISMS-P v2.0을 기준으로 합니다. 규정이 개정되면 해당 규칙을 업데이트하세요.

---

## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root. If it does, read the section tagged with `korean-compliance` and apply those project-specific lessons alongside the rules below.

---

## Category 1: 개인정보보호 (Privacy / PIPA) (CRITICAL)

### Rule 1: 개인정보 수집 시 명시적 동의 — Explicit Consent for Personal Data Collection

**Impact:** CRITICAL — PIPA requires explicit, informed consent before collecting personal information. Violations can result in fines up to 5% of related revenue.

❌ **Wrong:**
```javascript
// Collecting data without explicit consent
app.post("/signup", (req, res) => {
  const { name, email, phone } = req.body;
  db.users.create({ name, email, phone });
  res.json({ success: true });
});
```

✅ **Correct:**
```javascript
// Require explicit consent with specific purpose disclosure
app.post("/signup", (req, res) => {
  const { name, email, phone, privacyConsent, marketingConsent } = req.body;

  if (!privacyConsent) {
    return res.status(400).json({
      error: "개인정보 수집·이용 동의가 필요합니다.",
      errorEn: "Privacy consent is required."
    });
  }

  db.users.create({
    name, email, phone,
    privacyConsentedAt: new Date(),
    marketingConsentedAt: marketingConsent ? new Date() : null,
    consentVersion: "2026-03-01-v1"  // Track which consent form version
  });

  res.json({ success: true });
});
```

**Why:** PIPA Article 15 requires informing users of the purpose, items collected, retention period, and right to refuse. Consent must be separate for required vs. optional items (e.g., marketing).

### Rule 2: 개인정보 처리방침 필수 항목 — Privacy Policy Required Fields

**Impact:** CRITICAL — PIPA Article 30 mandates specific items in the privacy policy. Missing items trigger regulatory action.

✅ **Required sections in privacy policy (개인정보 처리방침):**

```markdown
1. 개인정보의 처리 목적 (Purpose of processing)
2. 처리하는 개인정보의 항목 (Items of personal info processed)
3. 개인정보의 처리 및 보유 기간 (Retention period)
4. 개인정보의 제3자 제공 (Third-party sharing)
5. 개인정보의 위탁 (Outsourced processing)
6. 정보주체의 권리·의무 및 행사방법 (Data subject rights)
7. 개인정보의 파기 (Data destruction)
8. 개인정보 보호책임자 (Privacy officer contact)
9. 개인정보 처리방침 변경 (Policy change notification)
10. 개인정보의 안전성 확보조치 (Security measures)
```

**Why:** The Personal Information Protection Commission (PIPC) audits privacy policies. Missing sections are the most common finding.

### Rule 3: 주민등록번호 수집 금지 — Never Collect Resident Registration Numbers

**Impact:** CRITICAL — PIPA Article 24-2 prohibits collection of resident registration numbers (주민등록번호) except where specifically permitted by law.

❌ **Wrong:**
```html
<label>주민등록번호</label>
<input type="text" name="residentNumber" placeholder="000000-0000000" />
```

✅ **Correct:**
```html
<!-- Use alternative identity verification methods -->
<button onclick="requestPhoneVerification()">
  휴대폰 본인인증
</button>
<!-- Or use CI/DI from identity verification services -->
```

**Why:** Since 2014, collecting resident registration numbers is prohibited for most services. Use phone verification (휴대폰 본인인증), I-PIN, or other alternatives.

### Rule 4: 개인정보 보유기간 및 파기 — Data Retention and Destruction

**Impact:** CRITICAL — PIPA requires destroying personal data when the retention period expires or the purpose is fulfilled.

❌ **Wrong:**
```python
# Keeping user data forever
def delete_account(user_id):
    db.users.update(user_id, {"status": "inactive"})  # Soft delete only
```

✅ **Correct:**
```python
def delete_account(user_id):
    user = db.users.get(user_id)

    # Separate legally required retention from deletion
    if user.has_transactions:
        # 전자상거래법: 거래 기록 5년 보관
        db.transaction_archive.create({
            "user_id": user_id,
            "retain_until": datetime.now() + timedelta(days=5*365),
            "reason": "전자상거래 등에서의 소비자보호에 관한 법률"
        })

    # Destroy personal data immediately
    db.users.delete(user_id)  # Hard delete
    db.user_logs.delete_by_user(user_id)

    log.info(f"개인정보 파기 완료: user_id={user_id}")
```

**Why:** PIPA Article 21 requires prompt destruction. However, other laws (e-commerce law, tax law) may require retaining certain records. Separate the two.

---

## Category 2: ISMS-P 인증 (HIGH)

### Rule 5: 접근 권한 관리 — Access Control Management

**Impact:** HIGH — ISMS-P requires role-based access control with periodic reviews.

❌ **Wrong:**
```python
# Admin check using simple boolean
if user.is_admin:
    return all_data()
```

✅ **Correct:**
```python
from enum import Enum

class Permission(Enum):
    READ_USER = "read:user"
    WRITE_USER = "write:user"
    READ_ADMIN = "read:admin"
    MANAGE_SYSTEM = "manage:system"

def check_permission(user, required_permission: Permission):
    """ISMS-P 2.5.1: 최소 권한 원칙에 따른 접근 통제"""
    if required_permission not in user.permissions:
        log.warning(
            f"접근 거부: user={user.id}, "
            f"required={required_permission.value}"
        )
        raise PermissionDenied("접근 권한이 없습니다.")
    return True

# Usage
check_permission(current_user, Permission.READ_ADMIN)
data = get_admin_data()
```

**Why:** ISMS-P control 2.5.1 requires the principle of least privilege. Simple admin/non-admin is insufficient for certification.

### Rule 6: 개인정보 암호화 — Personal Data Encryption

**Impact:** HIGH — ISMS-P requires encryption of personal data in transit and at rest.

❌ **Wrong:**
```python
# Storing sensitive data in plaintext
db.execute(
    "INSERT INTO users (name, phone, email) VALUES (?, ?, ?)",
    (name, phone, email)
)
```

✅ **Correct:**
```python
from cryptography.fernet import Fernet

# Encrypt PII at rest (ISMS-P 2.6.1)
def encrypt_pii(plaintext: str, key: bytes) -> str:
    f = Fernet(key)
    return f.encrypt(plaintext.encode()).decode()

def store_user(name, phone, email):
    db.execute(
        "INSERT INTO users (name, phone_enc, email_enc, phone_hash) "
        "VALUES (?, ?, ?, ?)",
        (
            name,  # Name may not require encryption depending on context
            encrypt_pii(phone, PII_KEY),
            encrypt_pii(email, PII_KEY),
            hash_for_search(phone)  # Searchable hash for lookups
        )
    )
```

**Why:** ISMS-P control 2.6.1 requires encryption of passwords, resident registration numbers, financial info, and biometric data. Phone and email should also be encrypted per PIPC guidance.

### Rule 7: 보안 로깅 및 감사 추적 — Security Logging and Audit Trail

**Impact:** HIGH — ISMS-P requires comprehensive logging of access to personal data.

❌ **Wrong:**
```python
def get_user_data(user_id):
    return db.users.get(user_id)
```

✅ **Correct:**
```python
def get_user_data(user_id, accessor_id, purpose):
    """ISMS-P 2.8.4: 개인정보 접근 기록 관리"""
    data = db.users.get(user_id)

    audit_log.create({
        "timestamp": datetime.now(KST),
        "accessor_id": accessor_id,
        "target_user_id": user_id,
        "action": "READ",
        "purpose": purpose,
        "ip_address": request.remote_addr,
        "data_fields_accessed": ["name", "email", "phone"]
    })

    return data
```

**Why:** ISMS-P control 2.8.4 requires logging who accessed what personal data, when, and why. Logs must be retained for at least 1 year (2 years for information communications service providers processing personal data of 10,000+ users, per PIPC enforcement guidelines).

### Rule 8: 개인정보 유출 통지 — Breach Notification (72 Hours)

**Impact:** CRITICAL — PIPA Article 34 (2023 amendment) requires notifying affected individuals and PIPC within 72 hours of discovering a personal data breach. Failure to notify is a separate violation.

❌ **Wrong:**
```python
# Discovering a breach and only logging it
def handle_breach(incident):
    log.error(f"Data breach detected: {incident}")
    # No notification to authorities or users
```

✅ **Correct:**
```python
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

def handle_breach(incident):
    """PIPA Article 34: 72시간 이내 유출 통지 의무"""
    discovered_at = datetime.now(KST)
    notification_deadline = discovered_at + timedelta(hours=72)

    # 1. Internal incident record
    breach_record = {
        "incident_id": incident.id,
        "discovered_at": discovered_at.isoformat(),
        "notification_deadline": notification_deadline.isoformat(),
        "affected_count": incident.affected_users,
        "data_types": incident.compromised_fields,
    }
    db.breach_log.create(breach_record)

    # 2. Notify PIPC (개인정보보호위원회)
    notify_pipc(breach_record)

    # 3. Notify affected individuals
    notify_affected_users(
        incident.affected_users,
        message_ko="귀하의 개인정보가 유출되었을 가능성이 있습니다. "
                    "유출 항목, 시점, 대응 조치를 안내드립니다.",
        breach_details=breach_record
    )

    # 4. Log for ISMS-P audit trail
    log.critical(
        f"Breach notification initiated: incident={incident.id}, "
        f"affected={incident.affected_users}, deadline={notification_deadline}"
    )
```

**Why:** The 2023 PIPA amendment shortened the breach notification window to 72 hours (from 5 days). Notification must include: what was leaked, when, what the company is doing about it, and how users can protect themselves.

---

## Category 3: 정보통신망법 및 전자금융거래법 (Network Act & E-Finance) (HIGH)

### Rule 9: 정보통신망법 — Online Service Provider Obligations

**Impact:** HIGH — The Network Act (정보통신망법) applies to all online information and communications service providers and has requirements that overlap with but extend beyond PIPA.

✅ **Key obligations under 정보통신망법:**

```markdown
1. 이용자 동의 없이 개인정보 수집 금지 (No collection without user consent)
2. 개인정보 취급방침 공개 (Public privacy handling policy)
3. 개인정보 유출 시 24시간 이내 신고 (Report breaches to KISA within 24 hours)
4. 만 14세 미만 아동 개인정보 — 법정대리인 동의 필수 (Parental consent for children under 14)
5. 이용자 탈퇴 시 개인정보 즉시 파기 (Immediate destruction on account deletion)
6. 야간 시간 (오후 10시~오전 8시) 광고성 정보 전송 금지 (No marketing messages 10PM-8AM KST)
```

**Why:** For online services, the Network Act's 24-hour breach notification to KISA is stricter than PIPA's 72-hour deadline to PIPC. Both must be met. The nighttime marketing restriction (오후 10시~오전 8시) is commonly violated and heavily fined.

### Rule 10: 전자금융거래법 — Electronic Financial Transaction Requirements

**Impact:** HIGH — The Electronic Financial Transactions Act (전자금융거래법) applies to any service that processes payments, transfers, or financial transactions in Korea.

✅ **Key requirements:**

```python
# Electronic Financial Transactions Act compliance checklist
EFTL_REQUIREMENTS = {
    "이용자 보호": {
        "거래 내역 통지": "Every transaction must generate an immediate notification to the user",
        "오류 정정": "Users can request error correction within 30 days",
        "무권한 거래": "Service provider bears liability for unauthorized transactions unless user negligence proven",
    },
    "기술적 보호조치": {
        "접근매체 관리": "Payment credentials must be encrypted at rest (AES-256+)",
        "전자서명": "Transactions above threshold require electronic signature or 2FA",
        "기록 보관": "Transaction records retained for 5 years minimum",
    },
    "등록/허가": {
        "전자금융업자 등록": "Must register with FSC (금융위원회) as electronic financial business operator",
        "자본금 요건": "Minimum capital requirements vary by business type",
    }
}
```

**Why:** Operating a payment or financial service without FSC registration is a criminal offense. Even simple e-commerce checkout flows must comply with transaction notification and record retention requirements.

---

## Category 4: 한국표준시 및 현지화 (KST & Localization) (MEDIUM)

### Rule 11: 한국표준시(KST) 올바른 처리 — Proper KST Datetime Handling

**Impact:** MEDIUM — Incorrect timezone handling causes data inconsistencies in Korean services.

❌ **Wrong:**
```python
from datetime import datetime

# Using UTC without conversion for Korean users
created_at = datetime.utcnow()
display_date = created_at.strftime("%Y-%m-%d %H:%M")
```

✅ **Correct:**
```python
from datetime import datetime
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

# Store in UTC, display in KST
created_at = datetime.now(ZoneInfo("UTC"))

# For display to Korean users
display_date = created_at.astimezone(KST).strftime("%Y년 %m월 %d일 %H:%M")

# For Microsoft Graph API — use Windows timezone ID
graph_event = {
    "start": {
        "dateTime": "2026-03-31T09:00:00",
        "timeZone": "Korea Standard Time"  # NOT "Asia/Seoul"
    }
}
```

**Why:** Korea uses UTC+9 year-round (no daylight saving). Use `Asia/Seoul` for IANA systems, `Korea Standard Time` for Microsoft/Windows systems. Always store UTC, display KST.

### Rule 12: 한국어 날짜/숫자 포맷 — Korean Date and Number Formatting

**Impact:** MEDIUM — Korean users expect specific formatting conventions.

❌ **Wrong:**
```javascript
// Using US format
const date = new Date().toLocaleDateString("en-US"); // "3/31/2026"
const price = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD"
}).format(50000); // "$50,000.00"
```

✅ **Correct:**
```javascript
// Korean date format
const date = new Date().toLocaleDateString("ko-KR", {
  year: "numeric", month: "long", day: "numeric"
}); // "2026년 3월 31일"

// Korean currency format
const price = new Intl.NumberFormat("ko-KR", {
  style: "currency", currency: "KRW"
}).format(50000); // "₩50,000"

// Korean phone number format
function formatKoreanPhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("02")) {
    // Seoul area code
    return cleaned.replace(/(\d{2})(\d{3,4})(\d{4})/, "$1-$2-$3");
  }
  // Mobile or other area codes
  return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
}
```

**Why:** Korean conventions: dates use 년/월/일, currency is KRW (₩) with no decimal places, phone numbers use specific hyphenation patterns.

### Rule 13: 한국어 에러 메시지 및 사용자 안내 — Korean Error Messages and User Guidance

**Impact:** MEDIUM — Korean enterprise users expect Korean-language error messages with formal tone (합니다체).

❌ **Wrong:**
```javascript
// English-only errors or informal Korean
throw new Error("Something went wrong");
// or
throw new Error("뭔가 잘못됐어요");  // Too informal
```

✅ **Correct:**
```javascript
// Bilingual errors with formal Korean (합니다체)
class AppError extends Error {
  constructor(messageKo, messageEn, code) {
    super(messageEn);
    this.messageKo = messageKo;
    this.code = code;
  }
}

// Common error messages
const ERRORS = {
  AUTH_FAILED: new AppError(
    "인증에 실패하였습니다. 다시 시도해 주세요.",
    "Authentication failed. Please try again.",
    "AUTH_001"
  ),
  NOT_FOUND: new AppError(
    "요청하신 정보를 찾을 수 없습니다.",
    "The requested information was not found.",
    "NOT_FOUND_001"
  ),
  PERMISSION_DENIED: new AppError(
    "접근 권한이 없습니다. 관리자에게 문의해 주세요.",
    "Access denied. Please contact your administrator.",
    "AUTH_002"
  ),
  SERVER_ERROR: new AppError(
    "서비스에 일시적인 오류가 발생하였습니다. 잠시 후 다시 시도해 주세요.",
    "A temporary service error occurred. Please try again later.",
    "SYS_001"
  )
};
```

**Why:** Korean enterprise software uses formal polite speech (합니다체). Error codes help support teams diagnose issues across language barriers.

---

## Category 4: AI 윤리 (NIA AI Ethics) (MEDIUM)

### Rule 14: AI 서비스 투명성 — AI Service Transparency

**Impact:** MEDIUM — NIA (한국지능정보사회진흥원) AI ethics guidelines require transparency when AI is used in decision-making.

❌ **Wrong:**
```python
# AI decision with no disclosure
def approve_loan(applicant):
    score = ai_model.predict(applicant.features)
    return score > 0.7
```

✅ **Correct:**
```python
def approve_loan(applicant):
    """AI 기반 대출 심사 — NIA 인공지능 윤리기준 준수"""
    score = ai_model.predict(applicant.features)
    decision = score > 0.7

    # AI 사용 사실 고지 (Disclose AI usage)
    result = {
        "decision": decision,
        "ai_disclosure": {
            "ko": "본 심사는 AI 모델을 활용하여 수행되었습니다. "
                  "결과에 이의가 있으시면 담당자에게 문의해 주세요.",
            "en": "This assessment was performed using an AI model. "
                  "If you have objections, please contact our staff."
        },
        "human_review_available": True,
        "appeal_contact": "support@example.com"
    }

    # Log for accountability
    audit_log.create({
        "type": "ai_decision",
        "model_version": ai_model.version,
        "input_features": applicant.feature_names,  # Names only, not values
        "score": score,
        "decision": decision,
        "timestamp": datetime.now(KST)
    })

    return result
```

**Why:** NIA's AI ethics standards (updated 2023) recommend transparency, accountability, and the right to human review for AI-assisted decisions. While not legally binding, they are increasingly referenced in government procurement and certification.

---

## Pre-Deployment Checklist (한국 서비스)

**개인정보보호 (Privacy):**
- [ ] 개인정보 처리방침이 PIPA Article 30의 10개 필수 항목을 모두 포함
- [ ] 개인정보 수집 시 명시적 동의 UI 구현 (필수/선택 분리)
- [ ] 주민등록번호 수집하지 않음 (대체 인증 수단 사용)
- [ ] 개인정보 보유기간 설정 및 자동 파기 구현
- [ ] 개인정보 처리 위탁 시 위탁 계약 체결 및 고지

**ISMS-P (해당 시):**
- [ ] 역할 기반 접근 통제(RBAC) 구현
- [ ] 개인정보 암호화 (전송 시 TLS, 저장 시 AES-256 이상)
- [ ] 개인정보 접근 로그 기록 (최소 1년 보관)
- [ ] 보안 사고 대응 절차 수립

**현지화 (Localization):**
- [ ] 날짜 표시: YYYY년 MM월 DD일 형식
- [ ] 통화 표시: ₩ 기호, 소수점 없음
- [ ] 에러 메시지: 한국어 합니다체 사용
- [ ] 시간대: KST (UTC+9) 올바르게 처리

**AI 윤리 (해당 시):**
- [ ] AI 사용 사실 고지
- [ ] AI 판단에 대한 이의 제기 절차 안내
- [ ] AI 모델 버전 및 결정 로그 기록
