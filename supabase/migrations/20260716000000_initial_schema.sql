-- Extension yang dibutuhkan
create extension if not exists "uuid-ossp";
create extension if not exists "vector";  -- untuk simpan & cari embedding wajah langsung di Postgres

create table sites (
    id uuid primary key default uuid_generate_v4(),
    name text not null,                    -- misal: "Gerbang Utama", "Gerbang Kontainer"
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create type camera_purpose as enum ('face_recognition', 'plate_detection', 'both');

create table cameras (
    id uuid primary key default uuid_generate_v4(),
    site_id uuid not null references sites(id),
    name text not null,                    -- misal: "CAM1", "CAM2"
    purpose camera_purpose not null,
    stream_url text,                       -- RTSP url atau identifier webcam lokal
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create type person_type as enum ('employee', 'driver');

create table persons (
    id uuid primary key default uuid_generate_v4(),
    person_type person_type not null,
    full_name text not null,
    phone_number text,
    photo_url text,                        -- foto profil utama (bukan foto enrollment mentah)
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create table employee_details (
    person_id uuid primary key references persons(id),
    employee_id text unique not null,      -- NIK/NIP internal TPS
    department text,
    position text
);

create table driver_details (
    person_id uuid primary key references persons(id),
    license_number text,                   -- nomor SIM
    company_name text,                     -- perusahaan ekspedisi/trucking asal sopir
    company_phone text
);

create table face_embeddings (
    id uuid primary key default uuid_generate_v4(),
    person_id uuid not null references persons(id),
    embedding vector(512) not null,        -- 512 dim, sesuai output ArcFace/InsightFace
    model_name text not null default 'buffalo_l',
    is_primary boolean not null default false,
    source_image_url text,                 -- simpan foto asal untuk audit/re-enroll
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

-- Index untuk pencarian kemiripan cepat (cosine distance)
create index on face_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create type vehicle_type as enum ('truck', 'car', 'motorcycle', 'other');

create table vehicles (
    id uuid primary key default uuid_generate_v4(),
    plate_number text unique not null,     -- dinormalisasi (uppercase, tanpa spasi)
    vehicle_type vehicle_type not null default 'truck',
    owner_company text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create type model_component as enum ('plate_detection', 'face_recognition', 'liveness', 'plate_ocr');

create table model_versions (
    id uuid primary key default uuid_generate_v4(),
    component model_component not null,
    version_name text not null,            -- misal: "plate_detector_v2"
    metrics jsonb,                         -- simpan mAP, precision, recall, dst
    is_active boolean not null default false,
    deployed_at timestamptz not null default now()
);

-- =====================================================================
-- 6. ATTENDANCE LOGS (hasil absensi wajah)
-- =====================================================================

create type attendance_status as enum ('recognized', 'unrecognized', 'rejected_spoof');

create table attendance_logs (
    id uuid primary key default uuid_generate_v4(),
    person_id uuid references persons(id),         -- null kalau unrecognized
    camera_id uuid not null references cameras(id),
    status attendance_status not null,
    similarity_score numeric(5,4),
    liveness_score numeric(5,4),
    captured_image_url text,               -- snapshot untuk audit
    model_version_id uuid references model_versions(id),
    detected_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 7. PLATE DETECTION LOGS
-- =====================================================================

create table plate_detection_logs (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid references vehicles(id),        -- null kalau plat tidak dikenali/belum terdaftar
    camera_id uuid not null references cameras(id),
    raw_ocr_text text,
    cleaned_plate_text text,
    detection_confidence numeric(5,4),     -- confidence dari YOLO
    captured_image_url text,
    model_version_id uuid references model_versions(id),
    detected_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create type dashboard_role as enum ('admin', 'staff', 'viewer');

create table profiles (
    id uuid primary key references auth.users(id),
    full_name text not null,
    role dashboard_role not null default 'viewer',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table audit_logs (
    id uuid primary key default uuid_generate_v4(),
    actor_profile_id uuid references profiles(id),
    action text not null,                  -- misal: "delete_person", "update_vehicle"
    target_table text,
    target_id uuid,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index idx_attendance_logs_person on attendance_logs(person_id);
create index idx_attendance_logs_detected_at on attendance_logs(detected_at);
create index idx_plate_logs_vehicle on plate_detection_logs(vehicle_id);
create index idx_plate_logs_detected_at on plate_detection_logs(detected_at);
create index idx_vehicles_plate_number on vehicles(plate_number);

alter table sites enable row level security;
alter table cameras enable row level security;
alter table persons enable row level security;
alter table employee_details enable row level security;
alter table driver_details enable row level security;
alter table face_embeddings enable row level security;
alter table vehicles enable row level security;
alter table model_versions enable row level security;
alter table attendance_logs enable row level security;
alter table plate_detection_logs enable row level security;
alter table profiles enable row level security;
alter table audit_logs enable row level security;

-- Helper: cek apakah user yang login adalah admin/staff (bukan viewer)
create or replace function is_staff_or_admin()
returns boolean as $$
    select exists (
        select 1 from profiles
        where id = auth.uid() and role in ('admin', 'staff')
    );
$$ language sql security definer stable;

-- Semua user yang sudah login (viewer/staff/admin) bisa baca data operasional
create policy "authenticated_read_sites" on sites for select using (auth.role() = 'authenticated');
create policy "authenticated_read_cameras" on cameras for select using (auth.role() = 'authenticated');
create policy "authenticated_read_persons" on persons for select using (auth.role() = 'authenticated');
create policy "authenticated_read_vehicles" on vehicles for select using (auth.role() = 'authenticated');
create policy "authenticated_read_attendance" on attendance_logs for select using (auth.role() = 'authenticated');
create policy "authenticated_read_plate_logs" on plate_detection_logs for select using (auth.role() = 'authenticated');
create policy "authenticated_read_model_versions" on model_versions for select using (auth.role() = 'authenticated');

-- Hanya admin/staff yang boleh insert/update/delete (kelola data master, enrollment, dst)
create policy "staff_manage_sites" on sites for all using (is_staff_or_admin());
create policy "staff_manage_cameras" on cameras for all using (is_staff_or_admin());
create policy "staff_manage_persons" on persons for all using (is_staff_or_admin());
create policy "staff_manage_employee_details" on employee_details for all using (is_staff_or_admin());
create policy "staff_manage_driver_details" on driver_details for all using (is_staff_or_admin());
create policy "staff_manage_face_embeddings" on face_embeddings for all using (is_staff_or_admin());
create policy "staff_manage_vehicles" on vehicles for all using (is_staff_or_admin());
create policy "staff_manage_model_versions" on model_versions for all using (is_staff_or_admin());
create policy "staff_manage_attendance" on attendance_logs for all using (is_staff_or_admin());
create policy "staff_manage_plate_logs" on plate_detection_logs for all using (is_staff_or_admin());

-- Profiles: lihat profil sendiri, atau semua kalau admin
create policy "profiles_select_own_or_admin" on profiles for select
    using (auth.uid() = id or is_staff_or_admin());

-- Audit logs: cuma admin yang bisa baca
create policy "audit_logs_admin_only" on audit_logs for select
    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));