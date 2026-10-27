# Payment deactivation
- [x] Block paid checkout, card setup, and meeting-triggered subscription creation on deployed endpoints; all return 403 payments_disabled.
- [x] Disable the pricing purchase action and verify rejection checks; policy test and browser check passed.
- [x] Pause all four existing Intentsly subscription collections without canceling access; no open checkout sessions exist.
- [x] Deactivate the Intentsly payment link and void all five unpaid Intentsly subscription invoices; unrelated businesses remain unchanged.