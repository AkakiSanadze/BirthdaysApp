# BirthdaysApp - დაბადების დღეების აპლიკაცია

ეს აპლიკაცია გეხმარებათ თვალი ადევნოთ თქვენი ოჯახის წევრების, მეგობრებისა და კოლეგების დაბადების დღეებს. აპლიკაცია მუშაობს ბრაუზერში და ინახავს მონაცემებს თქვენს მოწყობილობაზე.

## მახასიათებლები

- დაბადების დღეების ქრონოლოგიური სორტირება (უახლოესი დღეები პირველად)
- თვეებად დაჯგუფება ადვილი ნავიგაციისთვის
- დაბადების დღემდე დარჩენილი დღეების ჩვენება
- შეტყობინება როდესაც დღეს ვინმეს დაბადების დღეა
- დაბადების დღეების ძიება
- დაბადების დღეების ექსპორტი/იმპორტი
- კალენდარში ექსპორტი და ავტომატური შეხსენებები
- მუქი/ნათელი თემის მხარდაჭერა
- ქართული ენის მხარდაჭერა
- ავტომატური სარეზერვო ასლის შექმნა

## თარიღების მუშაობის პრინციპი

აპლიკაცია ავტომატურად ალაგებს დაბადების დღეებს დარჩენილი დროის მიხედვით:

1. დაბადების დღეები დალაგებულია იმის მიხედვით თუ რამდენი დღე რჩება დაბადების დღემდე
2. მიმდინარე წლის დაბადების დღეები ნაჩვენებია პირველად
3. თუ დაბადების დღე უკვე გავიდა ამ წელს, აპლიკაცია აჩვენებს დროს მომავალ წლამდე
4. თვეები თარიღდება, თუ ისინი მომდევნო წელს არის (მაგ. "აპრილი 2025")
5. თუ შეცდომით შეიყვანთ მომავალ წელს დაბადების თარიღად, აპლიკაცია ავტომატურად გაასწორებს

## ხშირად დასმული კითხვები

### რატომ ვხედავ თარიღებს 2025 ან 2026 წლებში?
ეს ნორმალურია. აპლიკაცია აჩვენებს მომავალ დაბადების დღეებს. თუ დაბადების დღე უკვე გავიდა მიმდინარე წელს, შემდეგი დაბადების დღე მომავალ წელს იქნება.

### რატომ მქონდა შეცდომა თარიღში?
ზოგჯერ დაბადების დღეებზე დამატებისას, შესაძლებელია შეიყვანოთ შეცდომით მომავალი წელი (როგორიცაა 2026). აპლიკაცია ავტომატურად ასწორებს ასეთ თარიღებს "ბაზის შეკეთება" ფუნქციით.

### როგორ არის დაბადების დღეები დალაგებული?
დაბადების დღეები დალაგებულია დარჩენილი დღეების მიხედვით - უახლოესი დაბადების დღეები პირველად. ეს ნიშნავს, რომ დღევანდელი დღის შემდეგ თვეები ქრონოლოგიურად არის დალაგებული, და მომავალი წლის დაბადების დღეები ნაჩვენებია ბოლოს.

### როგორ ვასწორებ შეცდომით შეყვანილ თარიღებს?
1. გახსენით მენიუ (მარცხენა ზედა კუთხეში)
2. აირჩიეთ "ბაზის შეკეთება"
3. აპლიკაცია ავტომატურად მოძებნის და გაასწორებს არასწორ მომავალ თარიღებს

### როგორ მუშაობს კალენდარში ექსპორტი?
აპლიკაცია საშუალებას გაძლევთ ყველა დაბადების დღე გადაიტანოთ თქვენს კალენდარში:

1. დააჭირეთ მენიუს ღილაკს და აირჩიეთ "ექსპორტი კალენდარში (.ics)"
2. ჩამოტვირთული ფაილი გახსენით თქვენს კალენდარში (Google Calendar, Apple Calendar, Outlook და ა.შ.)
3. კალენდარი ავტომატურად დაამატებს დაბადების დღეებს და დააყენებს შეხსენებებს

ყოველი დაბადების დღისთვის კალენდარში მიიღებთ:
- **ყოველწლიურ გამეორებად ივენთს** - დაბადების დღე ავტომატურად გამეორდება ყოველ წელს
- **სამ შეხსენებას**:
  - ერთი კვირით ადრე შეხსენება
  - ერთი დღით ადრე შეხსენება
  - დაბადების დღეს შეხსენება

შენიშვნა: ყოველთვის იხილავთ მხოლოდ მომავალ დაბადების დღეებს - თუ დაბადების დღე უკვე გავიდა მიმდინარე წელს, კალენდარში დაემატება მხოლოდ მომავალი წლის დაბადების დღე.

## ვერსიის ინფორმაცია
მიმდინარე ვერსია: 1.3.0
- დამატებულია თვე-წლის სწორი დამუშავება
- გასწორებულია მომავალი წლების დაბადების დღეების ჩვენება
- გაუმჯობესებულია სორტირება
- დამატებულია მონაცემთა ვალიდაცია
- დამატებულია გაუმჯობესებული კალენდარის ექსპორტი ავტომატური შეხსენებებით 