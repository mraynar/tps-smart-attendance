create or replace function match_face(query_embedding vector(512), match_threshold float default 0.5)
returns table (person_id uuid, full_name text, similarity float)
language sql stable
as $$
    select
        p.id as person_id,
        p.full_name,
        1 - (fe.embedding <=> query_embedding) as similarity
    from face_embeddings fe
    join persons p on p.id = fe.person_id
    where p.deleted_at is null
      and 1 - (fe.embedding <=> query_embedding) >= match_threshold
    order by fe.embedding <=> query_embedding
    limit 1;
$$;

insert into sites (id, name, description)
values ('00000000-0000-0000-0000-000000000001', 'Gerbang Testing', 'Site sementara untuk development')
on conflict (id) do nothing;

insert into cameras (id, site_id, name, purpose)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'CAM-TEST', 'face_recognition')
on conflict (id) do nothing;
  