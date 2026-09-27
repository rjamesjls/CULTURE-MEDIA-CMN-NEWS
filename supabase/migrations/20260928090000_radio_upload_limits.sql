-- Keep the radio bucket private; image limits are enforced by the upload API.
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'afoluku-radio' AND file_size_limit < 104857600;
