-- GİZ GURME CMS veritabanı kurulumu
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort_order integer not null,
  status text not null default 'active'
);

create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  menu_order integer not null,
  description text default '',
  recipe text default '',
  allergens text default '',
  photo_url text default '',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products
for select using (true);

drop policy if exists "public write categories" on public.categories;
create policy "public write categories" on public.categories
for all using (true) with check (true);

drop policy if exists "public write products" on public.products;
create policy "public write products" on public.products
for all using (true) with check (true);

insert into public.categories (name, sort_order, status)
values
('Başlangıçlar', 1, 'active'),
('Soğuk Mezeler', 2, 'active'),
('Yoğurtlu Mezeler', 3, 'active'),
('Sıcak Mezeler', 4, 'active'),
('Soğuk Deniz Mahsulleri', 5, 'active'),
('Sıcak Deniz Mahsulleri', 6, 'active')
on conflict (name) do nothing;

insert into public.products
(name, category, menu_order, description, recipe, allergens, photo_url, status)
values
('Tavuklu Sezar Salata', 'Başlangıçlar', 1, '', '', '', '', 'active'),
('İstanbul Salatası', 'Başlangıçlar', 2, '', '', '', '', 'active'),
('Domates Carpaccio', 'Başlangıçlar', 3, '', '', '', '', 'active'),
('Zeytin Diyarı', 'Başlangıçlar', 4, '', '', '', '', 'active'),
('Akdeniz Salatası', 'Başlangıçlar', 5, '', '', '', '', 'active'),
('Karides Carpaccio İçi Mozzarella', 'Başlangıçlar', 6, '', '', '', '', 'active'),
('Çilekli Semizotu Salatası', 'Başlangıçlar', 7, '', '', '', '', 'active'),
('Hardal Soslu Kuşkonmaz Enginar', 'Soğuk Mezeler', 1, '', '', '', '', 'active'),
('Kuru Dolma', 'Soğuk Mezeler', 2, '', '', '', '', 'active'),
('Şevketi Bostan', 'Soğuk Mezeler', 3, '', '', '', '', 'active'),
('Mercimek Köftesi', 'Soğuk Mezeler', 4, '', '', '', '', 'active'),
('Zeytinyağlı Bakla', 'Soğuk Mezeler', 5, '', '', '', '', 'active'),
('Zeytinyağlı Vişne Yaprak Sarma', 'Soğuk Mezeler', 6, '', '', '', '', 'active'),
('Yaprak Sarma', 'Soğuk Mezeler', 7, '', '', '', '', 'active'),
('Mücver', 'Soğuk Mezeler', 8, '', '', '', '', 'active'),
('Köri Soslu Patates', 'Soğuk Mezeler', 9, '', '', '', '', 'active'),
('Kısır Kinoa', 'Soğuk Mezeler', 10, '', '', '', '', 'active'),
('Kırmızı Lahana Salatası', 'Soğuk Mezeler', 11, '', '', '', '', 'active'),
('Gambilyon Fava', 'Soğuk Mezeler', 12, '', '', '', '', 'active'),
('Kabak Sıyırma', 'Soğuk Mezeler', 13, '', '', '', '', 'active'),
('Kaya Koru', 'Soğuk Mezeler', 14, '', '', '', '', 'active'),
('Közde Patlıcan Ezme', 'Soğuk Mezeler', 15, '', '', '', '', 'active'),
('Rum Mezesi', 'Soğuk Mezeler', 16, '', '', '', '', 'active'),
('Muhammara', 'Soğuk Mezeler', 17, '', '', '', '', 'active'),
('Acılı Ezme', 'Soğuk Mezeler', 18, '', '', '', '', 'active'),
('Antalya Piyazı', 'Soğuk Mezeler', 19, '', '', '', '', 'active'),
('Meyve Kurulu Girit Ezmesi', 'Soğuk Mezeler', 20, '', '', '', '', 'active'),
('Cunda Ezmesi', 'Soğuk Mezeler', 21, '', '', '', '', 'active'),
('Börülce Salatası', 'Soğuk Mezeler', 22, '', '', '', '', 'active'),
('İtalya Salatası', 'Soğuk Mezeler', 23, '', '', '', '', 'active'),
('Gerçek Rus Salatası', 'Soğuk Mezeler', 24, '', '', '', '', 'active'),
('Barbunya Pilaki', 'Soğuk Mezeler', 25, '', '', '', '', 'active'),
('Çerkez Tavuğu', 'Soğuk Mezeler', 26, '', '', '', '', 'active'),
('Sicilyano', 'Soğuk Mezeler', 27, '', '', '', '', 'active'),
('Çiğ Köfte', 'Soğuk Mezeler', 28, '', '', '', '', 'active'),
('Portakal Soslu Zeytinyağlı Enginar', 'Soğuk Mezeler', 29, '', '', '', '', 'active'),
('Keşk-i Badem', 'Soğuk Mezeler', 30, '', '', '', '', 'active'),
('Papagani', 'Yoğurtlu Mezeler', 1, '', '', '', '', 'active'),
('Haydari', 'Yoğurtlu Mezeler', 2, '', '', '', '', 'active'),
('Atom', 'Yoğurtlu Mezeler', 3, '', '', '', '', 'active'),
('Köpoğlu', 'Yoğurtlu Mezeler', 4, '', '', '', '', 'active'),
('Yoğurtlu Kapya', 'Yoğurtlu Mezeler', 5, '', '', '', '', 'active'),
('Yoğurtlu Semizotu', 'Yoğurtlu Mezeler', 6, '', '', '', '', 'active'),
('Havuç Tarator', 'Yoğurtlu Mezeler', 7, '', '', '', '', 'active'),
('Cevizli Roka', 'Yoğurtlu Mezeler', 8, '', '', '', '', 'active'),
('Semizotlu Pembe Sultan', 'Yoğurtlu Mezeler', 9, '', '', '', '', 'active'),
('Yoğurtlu Karamelize Pancar', 'Yoğurtlu Mezeler', 10, '', '', '', '', 'active'),
('Yoğurtlu Karamelize Mantar', 'Yoğurtlu Mezeler', 11, '', '', '', '', 'active'),
('Mütebbel', 'Yoğurtlu Mezeler', 12, '', '', '', '', 'active'),
('Kuru Cacık', 'Yoğurtlu Mezeler', 13, '', '', '', '', 'active'),
('Çağla Cacığı', 'Yoğurtlu Mezeler', 14, '', '', '', '', 'active'),
('Nuraniye', 'Yoğurtlu Mezeler', 15, '', '', '', '', 'active'),
('Babaganuş', 'Sıcak Mezeler', 1, '', '', '', '', 'active'),
('Paçanga', 'Sıcak Mezeler', 2, '', '', '', '', 'active'),
('Sigara Böreği', 'Sıcak Mezeler', 3, '', '', '', '', 'active'),
('Arnavut Ciğeri', 'Sıcak Mezeler', 4, '', '', '', '', 'active'),
('Haşlama İçli Köfte', 'Sıcak Mezeler', 5, '', '', '', '', 'active'),
('Fellah Köfte', 'Sıcak Mezeler', 6, '', '', '', '', 'active'),
('Kuru Domatesli Pastırmalı Humus', 'Sıcak Mezeler', 7, '', '', '', '', 'active'),
('Rum Böreği', 'Sıcak Mezeler', 8, '', '', '', '', 'active'),
('Patates Kabuğu Kızartması', 'Sıcak Mezeler', 9, '', '', '', '', 'active'),
('Mantar Dolması', 'Sıcak Mezeler', 10, '', '', '', '', 'active'),
('Çıtır Mantı', 'Sıcak Mezeler', 11, '', '', '', '', 'active'),
('Nar Ekşili Pırasa', 'Sıcak Mezeler', 12, '', '', '', '', 'active'),
('Kabak Topu', 'Sıcak Mezeler', 13, '', '', '', '', 'active'),
('Asparagia', 'Sıcak Mezeler', 14, '', '', '', '', 'active'),
('Fırından Ballı Soğan', 'Sıcak Mezeler', 15, '', '', '', '', 'active'),
('Tempura Tavuk', 'Sıcak Mezeler', 16, '', '', '', '', 'active'),
('Tereyağlı İstiridye Mantarı', 'Sıcak Mezeler', 17, '', '', '', '', 'active'),
('Hardal Soslu Karot Patates', 'Sıcak Mezeler', 18, '', '', '', '', 'active'),
('Tavuklu Lezzet Topu', 'Sıcak Mezeler', 19, '', '', '', '', 'active'),
('Kapya Dolması', 'Sıcak Mezeler', 20, '', '', '', '', 'active'),
('Lor Peynirli Pazı Sarma', 'Sıcak Mezeler', 21, '', '', '', '', 'active'),
('Yeşil Peri', 'Sıcak Mezeler', 22, '', '', '', '', 'active'),
('Meksika Peyniri', 'Sıcak Mezeler', 23, '', '', '', '', 'active'),
('Michellin Patlıcan', 'Sıcak Mezeler', 24, '', '', '', '', 'active'),
('Ispanaklı Patlıcan Halka', 'Sıcak Mezeler', 25, '', '', '', '', 'active'),
('Etli Yaprak Sarma', 'Sıcak Mezeler', 26, '', '', '', '', 'active'),
('Fındık Antep Lahmacun', 'Sıcak Mezeler', 27, '', '', '', '', 'active'),
('Patlıcan Sarma', 'Sıcak Mezeler', 28, '', '', '', '', 'active'),
('Ballı Kabak Teknesi', 'Sıcak Mezeler', 29, '', '', '', '', 'active'),
('Ciğer Pate', 'Sıcak Mezeler', 30, '', '', '', '', 'active'),
('Çıtırname', 'Sıcak Mezeler', 31, '', '', '', '', 'active'),
('Kayseri Yağlaması', 'Sıcak Mezeler', 32, '', '', '', '', 'active'),
('Lakerda', 'Soğuk Deniz Mahsulleri', 1, '', '', '', '', 'active'),
('Fesleğenli Soslu Levrek Marine', 'Soğuk Deniz Mahsulleri', 2, '', '', '', '', 'active'),
('Hardal Soslu Levrek Marine', 'Soğuk Deniz Mahsulleri', 3, '', '', '', '', 'active'),
('Soya Soslu Uskumru', 'Soğuk Deniz Mahsulleri', 4, '', '', '', '', 'active'),
('Midye Pilav', 'Soğuk Deniz Mahsulleri', 5, '', '', '', '', 'active'),
('Midye Pilaki', 'Soğuk Deniz Mahsulleri', 6, '', '', '', '', 'active'),
('Narenciye Soslu Deniz Börülcesi', 'Soğuk Deniz Mahsulleri', 7, '', '', '', '', 'active'),
('Ciroz', 'Soğuk Deniz Mahsulleri', 8, '', '', '', '', 'active'),
('Ahtapot Salatası', 'Soğuk Deniz Mahsulleri', 9, '', '', '', '', 'active'),
('Deniz Mahsulleri Salatası', 'Soğuk Deniz Mahsulleri', 10, '', '', '', '', 'active'),
('Hamsi Marin', 'Soğuk Deniz Mahsulleri', 11, '', '', '', '', 'active'),
('Tarama', 'Soğuk Deniz Mahsulleri', 12, '', '', '', '', 'active'),
('Avokadolu Karides Kokteyli', 'Soğuk Deniz Mahsulleri', 13, '', '', '', '', 'active'),
('Pavurya', 'Sıcak Deniz Mahsulleri', 1, '', '', '', '', 'active'),
('Balık Kokoreç', 'Sıcak Deniz Mahsulleri', 2, '', '', '', '', 'active'),
('Balık Köfte', 'Sıcak Deniz Mahsulleri', 3, '', '', '', '', 'active'),
('Denizci Böreği', 'Sıcak Deniz Mahsulleri', 4, '', '', '', '', 'active'),
('Midye Pilav', 'Sıcak Deniz Mahsulleri', 5, '', '', '', '', 'active'),
('Paella Dolması', 'Sıcak Deniz Mahsulleri', 6, '', '', '', '', 'active'),
('Deniz Mahsulleri Lazanya', 'Sıcak Deniz Mahsulleri', 7, '', '', '', '', 'active'),
('Karides Topu', 'Sıcak Deniz Mahsulleri', 8, '', '', '', '', 'active'),
('Karides Mantısı', 'Sıcak Deniz Mahsulleri', 9, '', '', '', '', 'active'),
('Kahverengi Soslu Karides', 'Sıcak Deniz Mahsulleri', 10, '', '', '', '', 'active'),
('Somon Lahmacun', 'Sıcak Deniz Mahsulleri', 11, '', '', '', '', 'active'),
('Kalamar Dolma', 'Sıcak Deniz Mahsulleri', 12, '', '', '', '', 'active'),
('Karidesli Mantar Kebabı', 'Sıcak Deniz Mahsulleri', 13, '', '', '', '', 'active'),
('Marry Me Karides', 'Sıcak Deniz Mahsulleri', 14, '', '', '', '', 'active');
