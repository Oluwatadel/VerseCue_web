ALTER TABLE vc_payment_receipts DROP CONSTRAINT IF EXISTS vc_payment_receipts_status_check;
ALTER TABLE vc_payment_receipts ADD CONSTRAINT vc_payment_receipts_status_check CHECK(status IN ('paid','refunded','disputed','review','test'));
