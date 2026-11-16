# Platformă de turnee și meciuri de fotbal amator

**Echipa:** 

1. Mario     - Product Owner
2. Stefan    - Dev. si Scrum Master
3. Claudiu   - Dev.
4. Alex      - Dev.

## Requirements Document

### 1. Descrierea problemei

Fotbalul amator se organizează haotic: grupuri de WhatsApp, liste de prezență făcute de mână, echipe dezechilibrate și niciun clasament care să arate cine joacă bine. Jucătorii nu găsesc ușor meciuri la nivelul lor și nici nu au o evidență a progresului. Organizatorii pierd timp cu programarea și cu calculul rezultatelor.

Sintetico permite crearea și alăturarea la meciuri pe categorii de vârstă, organizarea de campionate, comunicarea între jucători și un sistem de rank care ține cont de nivelul real al jucătorilor din fiecare meci.

### 2. Utilizatori

- **Jucător**: își face cont, caută și rezervă teren de fotbal, se înscrie, comunică, își urmărește rank-ul.
- **Administrator de teren**: deține terenul de fotbal care poate fi rezervat prin aplicație.
- **Organizator de campionat**: creează și administrează campionate, programează meciuri, introduce sau validează rezultate.
- **Administrator**: moderează conturile și conținutul, rezolvă dispute legate de rezultate.

### 3. Cerințe funcționale

| ID   | Cerință                                                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CF1  | Utilizatorul își poate crea cont, se poate autentifica și își poate edita profilul (nume, dată de naștere, poziție preferată, picior dominant).                      |
| CF2  | Categoria de vârstă a utilizatorului se determină automat din data nașterii (ex. U12, U15, U18, Seniori, Veterani 35+).                                                   |
| CF3  | Utilizatorul poate crea un meci (dată, oră, locație, număr de jucători, categorie de vârstă).                                                                          |
| CF4  | Utilizatorul poate căuta și filtra meciuri după categorie de vârstă, dată, locație și interval de rank.                                                               |
| CF5  | Utilizatorul se poate înscrie la un meci și își poate retrage înscrierea. Înscrierea este permisă doar dacă îndeplinește categoria meciului și mai există locuri. |
| CF6  | Sistemul calculează rank-ul mediu al meciului din rank-urile jucătorilor înscriși și îl afișează.                                                                     |
| CF7  | După finalizarea meciului se introduce rezultatul, iar sistemul actualizează rank-ul fiecărui jucător (vezi regula de calcul).                                            |
| CF8  | Fiecare utilizator are un rank vizibil în profil.                                                                                                                            |
| CF9  | Există un leaderboard global al utilizatorilor, filtrabil pe categorie de vârstă, sector Buc.                                                                              |
| CF10 | Organizatorul poate crea campionate (nume, categorie, perioadă, număr de echipe/participanți, regulament, premii).                                                         |
| CF11 | Utilizatorii se pot înscrie la campionate, iar organizatorul poate programa meciurile din campionat.                                                                         |
| CF12 | Fiecare campionat are un clasament propriu, actualizat după fiecare meci.                                                                                                    |
| CF13 | Utilizatorii pot trimite mesaje privat și în conversația unui meci.                                                                                                        |
| CF14 | Utilizatorii primesc notificări (înscriere confirmată, confirmă participarea, meci modificat sau anulat, rezultat introdus).                                              |
| CF15 | Administratorul poate suspenda conturi și poate corecta rezultate contestate.                                                                                                |

**Regula de calcul a rank-ului (CF7).** Se calculează rank-ul mediu al meciului (R_med). Pentru un jucător cu rank R:

- la victorie: puncte câștigate mai multe dacă R < R_med, mai puține dacă R > R_med;
- la înfrângere: puncte pierdute mai multe dacă R > R_med, mai puține dacă R < R_med.

### 4. Cerințe nefuncționale

- **Securitate**: parolele se stochează hash-uite, autentificarea folosește token-uri, iar datele personale ale minorilor se tratează conform GDPR (ex. consimțământ parental sub 16 ani).
- **Performanță**: lista de meciuri și leaderboard-ul se încarcă în sub 2 secunde pentru cel puțin 1000 de utilizatori.
- **Consistență**: actualizarea rank-urilor după un meci este atomică (toți jucătorii sau niciunul).
- **Utilizabilitate**: interfață responsive, utilizabilă de pe telefon.
- **Mentenabilitate**: cod acoperit de teste unitare, cu code coverage măsurat.
- **Integritate**: un rezultat nu poate fi modificat după validare, decat de administrator in urma contestatiilor.

### 5. Use Case Diagram

Actori: Jucător, Administrator de teren, Organizator (specializare a Jucătorului), Administrator.

- **Jucător**: Creare cont / Autentificare, Editare profil, Creare meci, Căutare meciuri, Înscriere la meci, Anulare înscriere, Vizualizare rank și istoric, Vizualizare leaderboard, Înscriere la campionat, Trimitere mesaje, Primire notificări.
- **Organizator**: Creare campionat, Programare meciuri campionat, Introducere/validare rezultat, Vizualizare clasament campionat.
- **Administrator**: Suspendare cont, Corectare rezultat contestat.

Cod PlantUML (se poate randa pe plantuml.com):

```
@startuml
left to right direction
actor Jucător
actor Organizator
actor "Administrator teren" as AdminTeren
actor Administrator
Organizator --|> Jucător

rectangle "Platformă turnee fotbal" {
  usecase "Creare cont / Autentificare" as UC1
  usecase "Editare profil" as UC2
  usecase "Creare meci" as UC3
  usecase "Căutare meciuri" as UC4
  usecase "Înscriere la meci" as UC5
  usecase "Anulare înscriere" as UC6
  usecase "Vizualizare rank și istoric" as UC7
  usecase "Vizualizare leaderboard" as UC8
  usecase "Înscriere la campionat" as UC9
  usecase "Trimitere mesaje" as UC10
  usecase "Creare campionat" as UC11
  usecase "Programare meciuri campionat" as UC12
  usecase "Introducere rezultat" as UC13
  usecase "Suspendare cont" as UC14
  usecase "Corectare rezultat" as UC15
  usecase "Calcul rank mediu" as UC16
  usecase "Actualizare rank" as UC17
  usecase "Adăugare / editare teren" as UC18
  usecase "Setare program și disponibilitate" as UC19
  usecase "Gestionare rezervări teren" as UC20
  usecase "Vizualizare calendar rezervări" as UC21
  usecase "Rezervare teren" as UC22
}

Jucător --> UC1
Jucător --> UC2
Jucător --> UC3
Jucător --> UC4
Jucător --> UC5
Jucător --> UC6
Jucător --> UC7
Jucător --> UC8
Jucător --> UC9
Jucător --> UC10
Organizator --> UC11
Organizator --> UC12
Organizator --> UC13
AdminTeren --> UC1
AdminTeren --> UC18
AdminTeren --> UC19
AdminTeren --> UC20
AdminTeren --> UC21
Administrator --> UC14
Administrator --> UC15

UC5 ..> UC16 : <<include>>
UC13 ..> UC17 : <<include>>
UC3 ..> UC22 : <<include>>
UC12 ..> UC22 : <<include>>
@enduml
```

---

## Product Goal

Să oferim jucătorilor amatori de fotbal o platformă unde găsesc rapid meciuri echilibrate pe categoria lor de vârstă, joacă în campionate organizate și își urmăresc progresul printr-un sistem de rank.

---

## User Stories

### Epic: Cont și profil

**US-01: Creare cont**
Ca **vizitator**, vreau să-mi creez un cont cu email și parolă, ca să pot folosi aplicația.

- Contul se creează cu un email valid și o parolă care respectă regulile minime.
- Un email deja folosit este refuzat cu mesaj clar.
- Parola se stochează hash-uită.

**US-02: Autentificare**
Ca **utilizator**, vreau să mă autentific, ca să-mi accesez contul.

- Cu date corecte se primește acces, cu date greșite apare o eroare.
- Sesiunea se menține prin token și expiră după o perioadă stabilită.
- Utilizatorul se poate deconecta.

**US-03: Editare profil**
Ca **jucător**, vreau să-mi editez profilul (nume, dată de naștere, poziție preferată, picior dominant), ca ceilalți să știe cine sunt.

- Câmpurile se salvează și se afișează în profil.
- Data nașterii nu poate fi în viitor.
- Datele minorilor sunt tratate conform GDPR (consimțământ parental sub 16 ani).

**US-04: Categorie de vârstă automată**
Ca **jucător**, vreau să fiu încadrat automat într-o categorie de vârstă, ca să joc doar cu persoane din categoria mea.

- Categoria (U12, U15, U18, Seniori, Veterani 35+) se calculează din data nașterii.
- Categoria se actualizează când se schimbă data nașterii sau trece pragul de vârstă.
- Categoria este vizibilă în profil și nu se poate edita direct.

### Epic: Terenuri

**US-05: Adăugare/editare teren**
Ca **administrator de teren**, vreau să adaug și să editez terenul meu (nume, adresă, sector, număr recomandat de jucători), ca să poată fi rezervat prin aplicație.

- Terenul apare în aplicație după salvare.
- Numărul de jucători este doar o **recomandare**, nu o limită strictă.
- Doar proprietarul terenului îl poate edita.

**US-06: Program și disponibilitate teren**
Ca **administrator de teren**, vreau să setez programul și intervalele disponibile, ca jucătorii să rezerve doar când terenul e liber.

- Se pot defini zilele și orele de funcționare.
- Se pot marca intervale indisponibile.
- Intervalele indisponibile nu pot fi rezervate.

**US-07: Rezervare teren**
Ca **jucător**, vreau să rezerv un teren pentru un interval orar, ca să am unde juca.

- Se pot alege doar intervale libere.
- Două rezervări nu se pot suprapune pe același teren.
- Rezervarea apare în calendarul terenului.

### Epic: Meciuri

**US-08: Creare meci**
Ca **jucător**, vreau să creez un meci (teren rezervat, dată, oră, număr de jucători, categorie de vârstă), ca să-mi adun oameni pentru un joc.

- Meciul se creează doar cu un teren rezervat valid.
- Dacă numărul de jucători diferă de cel recomandat de teren, apare un avertisment, dar meciul se poate crea.
- Meciul apare în lista de meciuri.

**US-09: Căutare și filtrare meciuri**
Ca **jucător**, vreau să caut și să filtrez meciurile după categorie, dată, locație și rank, ca să găsesc unul potrivit nivelului meu.

- Filtrele se pot combina.
- Lista afișează doar meciuri viitoare, cu locuri libere sau marcate ca pline.
- Fără rezultate se afișează un mesaj explicit.

**US-10: Înscriere la meci**
Ca **jucător**, vreau să mă înscriu la un meci, ca să-mi rezerv un loc.

- Înscrierea e permisă doar dacă meciul are locuri libere și categoria mea corespunde.
- Nu mă pot înscrie de două ori la același meci.
- După înscriere apar în lista de participanți.

**US-11: Anulare înscriere**
Ca **jucător**, vreau să-mi anulez înscrierea, ca să nu blochez un loc dacă nu mai pot veni.

- Locul devine liber imediat.
- Rank-ul mediu al meciului se recalculează.
- Anularea nu mai e posibilă după începerea meciului.

**US-14: Introducere rezultat meci**
Ca **jucător (participant)**, vreau să introduc rezultatul unui meci terminat, ca să se actualizeze rank-urile.

- Rezultatul se poate introduce doar după ora de încheiere și doar de un participant.
- Rezultatul introdus o dată nu mai poate fi schimbat.
- Meciul trece în starea „finalizat".

### Epic: Rank

**US-12: Rank inițial și afișare în profil**
Ca **jucător**, vreau să am un rank vizibil în profil, ca să știu ce nivel am.

- Contul nou pornește cu rank-ul inițial (propunere: 1000).
- Rank-ul se afișează în profil.

**US-13: Rank mediu al meciului**
Ca **jucător**, vreau să văd rank-ul mediu al unui meci înainte să mă înscriu, ca să știu cât de puternici sunt ceilalți.

- Rank-ul mediu se calculează din rank-urile jucătorilor înscriși.
- Se actualizează la fiecare înscriere sau anulare.
- Pentru un meci fără participanți se afișează „indisponibil".

**US-15: Calcul variație de rank**
Ca **jucător**, vreau ca punctele câștigate sau pierdute să depindă de rank-ul meu față de media meciului, ca punctajul să reflecte dificultatea adversarilor.

- La victorie: rank sub medie câștigă mai mult, rank peste medie câștigă mai puțin.
- La înfrângere: rank peste medie pierde mai mult, rank sub medie pierde mai puțin.
- Variația are o limită minimă și una maximă.
- Formula este documentată și acoperită de teste unitare (bun candidat pentru TDD).

**US-16: Aplicare actualizare rank după meci**
Ca **jucător**, vreau ca rank-ul meu să se actualizeze automat după rezultat, ca progresul să fie reflectat.

- Rank-urile tuturor participanților se actualizează după introducerea rezultatului.
- Actualizarea este atomică: toți jucătorii sau niciunul.
- Rank-ul nu poate deveni negativ.

**US-17: Leaderboard global**
Ca **jucător**, vreau să văd un leaderboard, filtrabil pe categorie de vârstă și sector, ca să mă compar cu ceilalți.

- Clasamentul este ordonat descrescător după rank.
- Filtrele pe categorie și sector se pot combina.
- Se încarcă în sub 2 secunde pentru cel puțin 1000 de utilizatori.

### Epic: Comunicare

**US-18: Conversație în meci**
Ca **jucător**, vreau să scriu mesaje în conversația unui meci, ca să ne coordonăm cu participanții.

- Doar participanții înscriși văd și scriu în conversație.
- Mesajele apar în ordine cronologică.

### Epic: Campionate

**US-19: Creare campionat**
Ca **organizator**, vreau să creez un campionat (nume, categorie, perioadă, număr de participanți, regulament, premii), ca să organizez competiții.

- Câmpurile obligatorii sunt validate.
- Campionatul apare în lista de campionate.
- Doar organizatorul îl poate modifica.

**US-20: Înscriere la campionat**
Ca **jucător**, vreau să mă înscriu la un campionat, ca să particip la competiție.

- Înscrierea e permisă doar pentru categoria campionatului și cât timp există locuri.
- Mă pot retrage înainte de începerea campionatului.

### De făcut în refinement

- Criterii de acceptare pentru fiecare story.
- Divizarea story-urilor prea mari
- Prioritizare (PO) și Planning Poker (Developers).
- Story-uri suplimentare pentru rezervă în backlog: administrator (suspendare cont, corectare rezultat), notificări.

### Idei de extindere

- Terenurile sunt pt un anume numar e jucatori. Administratorul de teren recomanda cati sa fie dar meciurile nu trebuie sa respecte neaparat numarul.
- Retragerea din meci atunci cand mai este putin timp pana la acesta apare pe contul utilizatorului printr-un fel de sistem de onoare.
- Pe langa rank sa avem si un punctaj pentru profil.
