-- SANDARBH reference seed data; safe to re-run.
insert into roles(name,description) values
('super_admin','System administration'),('chief_editor','Final editorial approval'),('managing_editor','Editorial workflow management'),('reporter','News reporting and drafts'),('researcher','Research and documents'),('fact_checker','Claim verification'),('content_editor','Copy and structure editing'),('social_media_manager','Social calendar management'),('reader','Read-only access')
on conflict(name) do nothing;
insert into categories(slug,name_hi,name_en,sort_order) values
('rashtriya','राष्ट्रीय','National',1),('rajya','राज्य','State',2),('rajniti','राजनीति','Politics',3),('samaj','समाज','Society',4),('arthvyavastha','अर्थव्यवस्था','Economy',5),('shiksha','शिक्षा','Education',6),('vishleshan','विश्लेषण','Analysis',7)
on conflict(slug) do nothing;
