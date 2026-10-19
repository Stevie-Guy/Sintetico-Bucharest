# Platformă de turnee și meciuri de fotbal amator

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

| ID | Cerință |
|---|---|
| CF1 | Utilizatorul își poate crea cont, se poate autentifica și își poate edita profilul (nume, dată de naștere, poziție preferată, picior dominant). |
| CF2 | Categoria de vârstă a utilizatorului se determină automat din data nașterii (ex. U12, U15, U18, Seniori, Veterani 35+). |
| CF3 | Utilizatorul poate crea un meci (dată, oră, locație, număr de jucători, categorie de vârstă). |
| CF4 | Utilizatorul poate căuta și filtra meciuri după categorie de vârstă, dată, locație și interval de rank. |
| CF5 | Utilizatorul se poate înscrie la un meci și își poate retrage înscrierea. Înscrierea este permisă doar dacă îndeplinește categoria meciului și mai există locuri. |
| CF6 | Sistemul calculează rank-ul mediu al meciului din rank-urile jucătorilor înscriși și îl afișează. |
| CF7 | După finalizarea meciului se introduce rezultatul, iar sistemul actualizează rank-ul fiecărui jucător (vezi regula de calcul). |
| CF8 | Fiecare utilizator are un rank vizibil în profil. |
| CF9 | Există un leaderboard global al utilizatorilor, filtrabil pe categorie de vârstă, sector Buc. |
| CF10 | Organizatorul poate crea campionate (nume, categorie, perioadă, număr de echipe/participanți, regulament, premii). |
| CF11 | Utilizatorii se pot înscrie la campionate, iar organizatorul poate programa meciurile din campionat. |
| CF12 | Fiecare campionat are un clasament propriu, actualizat după fiecare meci. |
| CF13 | Utilizatorii pot trimite mesaje privat și în conversația unui meci. |
| CF14 | Utilizatorii primesc notificări (înscriere confirmată, confirmă participarea, meci modificat sau anulat, rezultat introdus). |
| CF15 | Administratorul poate suspenda conturi și poate corecta rezultate contestate. |

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

## User Stories inițiale

1. Ca **vizitator**, vreau să-mi creez un cont cu email și parolă, ca să pot folosi aplicația.
2. Ca **jucător**, vreau să mă autentific și să-mi editez profilul (nume, dată de naștere, poziție preferată), ca ceilalți să știe cine sunt.
3. Ca **jucător**, vreau să fiu încadrat automat într-o categorie de vârstă, ca să joc doar cu persoane din categoria mea.
4. Ca **jucător**, vreau să creez un meci (dată, oră, locație, număr de jucători, categorie), ca să-mi adun oameni pentru un joc.
5. Ca **jucător**, vreau să caut și să filtrez meciurile după categorie, dată, locație și rank, ca să găsesc unul potrivit nivelului meu.
6. Ca **jucător**, vreau să mă înscriu la un meci, ca să-mi rezerv un loc.
7. Ca **jucător**, vreau să-mi anulez înscrierea la un meci, ca să nu blochez un loc dacă nu mai pot veni.
8. Ca **jucător**, vreau să văd rank-ul mediu al unui meci înainte să mă înscriu, ca să știu cât de puternici sunt ceilalți.
9. Ca **jucător**, vreau ca rank-ul meu să crească sau să scadă după meci în funcție de rezultat și de rank-ul mediu al meciului, ca punctajul să reflecte dificultatea adversarilor.
10. Ca **jucător**, vreau să văd istoricul modificărilor de rank din profil, ca să-mi urmăresc progresul.
11. Ca **jucător**, vreau să văd un leaderboard al utilizatorilor, filtrabil pe categorie de vârstă, ca să mă compar cu ceilalți.
12. Ca **organizator**, vreau să creez un campionat (nume, categorie, perioadă, regulament), ca să organizez competiții.
13. Ca **organizator**, vreau să programez meciurile unui campionat și să introduc rezultatele, ca să pot ține clasamentul actualizat.
14. Ca **jucător**, vreau să mă înscriu la un campionat și să-i văd clasamentul, ca să urmăresc evoluția competiției.
15. Ca **jucător**, vreau să trimit mesaje altor jucători, privat și în conversația unui meci, ca să ne coordonăm.

### De făcut în refinement
- Criterii de acceptare pentru fiecare story.
- Divizarea story-urilor prea mari (de exemplu 9 și 13).
- Dependențe (9 depinde de 8, 6 și de introducerea rezultatului).
- Prioritizare (PO) și Planning Poker (Developers).
- Story-uri suplimentare pentru rezervă în backlog: administrator (suspendare cont, corectare rezultat), notificări, validarea dublă a rezultatului de către căpitani.

### Idei de extindere
- Terenurile sunt pt un anume numar e jucatori. Administratorul de teren recomanda cati sa fie dar meciurile nu trebuie sa respecte neaparat numarul.
- Retragerea din meci atunci cand mai este putin timp pana la acesta apare pe contul utilizatorului printr-un fel de sistem de onoare.
- Pe langa rank sa avem si un punctaj pentru profil.