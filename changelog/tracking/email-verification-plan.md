# Email Verification System - Implementation Plan

## 📋 Overview

Implement email verification system for user registration to ensure email authenticity and improve security.

## ✅ Phase 1: UX Improvements (COMPLETED)

- [x] Fix Enter key functionality in LoginModal.tsx
- [x] Fix Enter key functionality in RegisterModal.tsx
- [x] Remove unnecessary onKeyDown from email and name fields
- [x] Keep onKeyDown only on password field for better UX

## ✅ Phase 2: Database Schema Updates (COMPLETED)

- [x] Add email verification fields to User model:
  ```prisma
  emailVerificationToken   String?
  emailVerificationExpires DateTime?
  ```
- [x] Update existing `emailVerified` field usage
- [x] Generate Prisma client with new schema

## ✅ Phase 3: Backend API Development (COMPLETED)

### 3.1 Email Verification APIs

- [x] `POST /api/auth/send-verification`
  - Generate verification token
  - Send verification email
  - Set expiration (5 minutes)
- [x] `GET /api/auth/verify-email?token=xxx`
  - Validate token and expiration
  - Update emailVerified to true
  - Clear verification token
  - Beautiful HTML response pages
- [x] `POST /api/auth/resend-verification`
  - Resend verification email
  - Update token and expiration
  - Rate limiting (1 minute between requests)

### 3.2 Email Service Integration

- [x] Choose email service (Nodemailer with Gmail SMTP)
- [x] Create email templates in Vietnamese
- [x] Configure SMTP settings
- [x] Create email utility functions

### 3.3 Authentication Logic Updates

- [x] Update registration API to NOT auto-login
- [x] Update login API to check emailVerified
- [x] Add verification status checks
- [x] Update NextAuth credentials provider
- [x] Update Google sign-in to auto-verify emails

## ✅ Phase 4: Frontend Components (COMPLETED)

### 4.1 New Components

- [x] `EmailVerificationModal.tsx`
  - Show after successful registration
  - Display verification instructions
  - Resend email button
  - Beautiful UI with icons and styling

### 4.2 Component Updates

- [x] Update `RegisterModal.tsx`
  - Remove auto-login after registration
  - Show verification modal instead
  - Handle API response properly
- [x] Update `LoginModal.tsx`
  - Check emailVerified status
  - Show verification prompt if needed
  - Handle EMAIL_NOT_VERIFIED error
- [x] Update `AuthModalProvider.tsx`
  - Add emailVerification modal type
- [x] Update `AuthModal.tsx`
  - Add EmailVerificationModal to switch statement

## 🔄 Phase 5: UX Flow Implementation (PENDING)

### 5.1 Registration Flow

1. User fills registration form
2. API creates user with emailVerified: false
3. Send verification email
4. Show EmailVerificationModal
5. User checks email and clicks link
6. Redirect to verification success page
7. User can now login

### 5.2 Login Flow

1. User attempts login
2. Check if emailVerified: true
3. If false: Show verification prompt
4. Option to resend verification email
5. If true: Normal login flow

### 5.3 Email Verification Flow

1. User clicks email link
2. Validate token and expiration
3. Update emailVerified: true
4. Show success page
5. Redirect to login after 3 seconds

## 🔄 Phase 6: Error Handling & Edge Cases (PENDING)

- [ ] Expired token handling
- [ ] Invalid token handling
- [ ] Email delivery failures
- [ ] Rate limiting for resend requests
- [ ] User already verified scenarios

## 🔄 Phase 7: Testing & Validation (PENDING)

- [ ] Test email delivery
- [ ] Test token expiration
- [ ] Test resend functionality
- [ ] Test edge cases
- [ ] User acceptance testing

## 📝 Technical Notes

### Email Template Structure

```html
Subject: Xác thực tài khoản ThanhHuy Store Body: - Chào mừng đến với ThanhHuy Store - Click button để xác thực trong
vòng 5 phút - Nếu không phải bạn, hãy bỏ qua email này
```

### Security Considerations

- Use crypto.randomBytes() for token generation
- Set short expiration time (5 minutes)
- Rate limit resend requests
- Validate token format and expiration
- Clear tokens after successful verification

### Environment Variables Needed

```env
EMAIL_SERVICE_API_KEY=xxx
EMAIL_FROM_ADDRESS=noreply@thanhhuystore.com
EMAIL_FROM_NAME=ThanhHuy Store
VERIFICATION_TOKEN_EXPIRES_MINUTES=5
```

## 🎯 Success Criteria

- [ ] Users must verify email before login
- [ ] Email delivery works reliably
- [ ] Smooth UX with clear instructions
- [ ] Proper error handling
- [ ] Vietnamese language support
- [ ] Mobile-responsive design
- [ ] 5-minute token expiration works
- [ ] Resend functionality works
- [ ] No security vulnerabilities

## 🚀 Implementation Priority

1. **High Priority**: Database schema + Basic APIs
2. **Medium Priority**: Email service integration
3. **Medium Priority**: Frontend components
4. **Low Priority**: Advanced error handling
5. **Low Priority**: Rate limiting and security hardening

---

_Created: 2025-07-07_
_Status: Planning Phase_
_Next Action: Await user approval to proceed with Phase 2_
