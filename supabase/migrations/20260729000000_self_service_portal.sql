-- =====================================================================
-- Self-service portal: hubungkan akun login (auth.users) ke persons
-- =====================================================================

-- Kolom penghubung: 1 akun login = 1 baris persons (pegawai/sopir)
alter table persons add column auth_user_id uuid unique references auth.users(id);

create index idx_persons_auth_user_id on persons(auth_user_id);

-- =====================================================================
-- Tabel baru: relasi sopir <-> truk (many-to-many)
-- Satu sopir bisa pakai beberapa truk berbeda dari waktu ke waktu
-- =====================================================================

create table driver_vehicles (
    id uuid primary key default uuid_generate_v4(),
    person_id uuid not null references persons(id),
    vehicle_id uuid not null references vehicles(id),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_driver_vehicles_person on driver_vehicles(person_id);
create index idx_driver_vehicles_vehicle on driver_vehicles(vehicle_id);

alter table driver_vehicles enable row level security;

-- =====================================================================
-- Helper: cek apakah baris persons tertentu adalah milik user yang login
-- =====================================================================

create or replace function is_own_person(p_person_id uuid)
returns boolean as $$
    select exists (
        select 1 from persons
        where id = p_person_id and auth_user_id = auth.uid()
    );
$$ language sql security definer stable;

-- =====================================================================
-- RLS: pegawai/sopir bisa UPDATE data diri sendiri
-- (baris persons/employee_details/driver_details dibuat admin duluan,
--  pegawai cuma melengkapi, bukan membuat baris baru)
-- =====================================================================

create policy "person_update_own" on persons for update
    using (auth_user_id = auth.uid());

create policy "employee_details_select_own" on employee_details for select
    using (is_own_person(person_id));

create policy "employee_details_update_own" on employee_details for update
    using (is_own_person(person_id));

create policy "driver_details_select_own" on driver_details for select
    using (is_own_person(person_id));

create policy "driver_details_update_own" on driver_details for update
    using (is_own_person(person_id));

-- =====================================================================
-- RLS: pegawai/sopir daftar wajah sendiri
-- =====================================================================

create policy "face_embeddings_select_own" on face_embeddings for select
    using (is_own_person(person_id));

create policy "face_embeddings_insert_own" on face_embeddings for insert
    with check (is_own_person(person_id));

-- =====================================================================
-- RLS: sopir daftarkan/hubungkan truk sendiri
-- =====================================================================

-- Semua user login boleh tambah truk baru (plat belum sensitif,
-- dan plate_number sudah unique constraint mencegah duplikat)
create policy "authenticated_insert_vehicles" on vehicles for insert
    with check (auth.role() = 'authenticated');

create policy "driver_vehicles_select_own" on driver_vehicles for select
    using (is_own_person(person_id));

create policy "driver_vehicles_insert_own" on driver_vehicles for insert
    with check (is_own_person(person_id));

create policy "driver_vehicles_update_own" on driver_vehicles for update
    using (is_own_person(person_id));
