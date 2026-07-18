-- Richer application lifecycle: beyond pending/approved/rejected, an admin can
-- mark an application 'under_review' or send it back as 'info_requested' with a
-- note the applicant sees and can act on. (Seller 'suspended' state already
-- exists on profiles.is_suspended, migration 0018.)
alter type application_status add value if not exists 'under_review';
alter type application_status add value if not exists 'info_requested';

alter table pro_applications add column if not exists review_note text;
