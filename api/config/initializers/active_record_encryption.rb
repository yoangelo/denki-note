if Rails.env.test? || Rails.env.development?
  Rails.application.config.active_record.encryption.primary_key = "test_primary_key_for_active_record_encryption"
  Rails.application.config.active_record.encryption.deterministic_key = "test_deterministic_key_for_encryption"
  Rails.application.config.active_record.encryption.key_derivation_salt = "test_key_derivation_salt_for_encryption"
end
