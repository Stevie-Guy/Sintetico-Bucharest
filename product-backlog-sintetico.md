# Product Backlog: Sintetico

**Product Goal:** Să oferim jucătorilor amatori de fotbal o platformă unde găsesc rapid meciuri echilibrate pe categoria lor de vârstă, joacă în campionate organizate și își urmăresc progresul printr-un sistem de rank.

**Observații de folosire**
- Coloana **SP** (Story Points) rămâne goală: se completează de Developers după Planning Poker, cu justificarea diferențelor mari.
- Ordinea și prioritățile sunt o **propunere de pornire** pentru Product Owner. Se validează și se justifică de echipă.
- Prioritate: **Must** (fără ele produsul nu funcționează), **Should** (importante, dar produsul merge fără ele).

---

## Prezentare generală (în ordinea priorității)

| ID | Epic | Story (pe scurt) | Prioritate | Depinde de | SP |
|---|---|---|---|---|---|
| US-01 | Cont și profil | Creare cont | Must | - | |
| US-02 | Cont și profil | Autentificare | Must | US-01 | |
| US-03 | Cont și profil | Editare profil | Must | US-02 | |
| US-04 | Cont și profil | Categorie de vârstă automată | Must | US-03 | |
| US-05 | Terenuri | Adăugare/editare teren | Must | US-02 | |
| US-06 | Terenuri | Program și disponibilitate teren | Must | US-05 | |
| US-07 | Terenuri | Rezervare teren | Must | US-06 | |
| US-08 | Meciuri | Creare meci | Must | US-04, US-07 | |
| US-09 | Meciuri | Căutare și filtrare meciuri | Must | US-08 | |
| US-10 | Meciuri | Înscriere la meci | Must | US-08 | |
| US-11 | Meciuri | Anulare înscriere | Must | US-10 | |
| US-12 | Rank | Rank inițial și afișare în profil | Must | US-03 | |
| US-13 | Rank | Rank mediu al meciului | Must | US-10, US-12 | |
| US-14 | Meciuri | Introducere rezultat meci | Must | US-10 | |
| US-15 | Rank | Calcul variație de rank | Must | US-13 | |
| US-16 | Rank | Aplicare actualizare rank după meci | Must | US-14, US-15 | |
| US-17 | Rank | Leaderboard global | Should | US-16 | |
| US-18 | Comunicare | Conversație în meci | Should | US-10 | |
| US-19 | Campionate | Creare campionat | Should | US-02 | |
| US-20 | Campionate | Înscriere la campionat | Should | US-19 | |

---

## Detalii story-uri

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

---

## Justificarea priorității

- **Must (US-01 – US-16)**: fluxul minim complet, de la cont la rank actualizat după un meci. Fără ele nu există un Increment funcțional care atinge Product Goal-ul. Story-urile de bază (cont, teren, rezervare) sunt primele, pentru că restul depind de ele.
- **Should (US-17 – US-20)**: leaderboard, mesaje și începutul zonei de campionate. Aduc valoare, dar produsul funcționează fără ele.

## Scoase temporar din backlog (de reintrodus mai târziu)
Istoric modificări rank, notificări, mesaje private, programare meciuri campionat, rezultate și clasament campionat, calendar rezervări pentru administratorul de teren, anulare rezervare de către administratorul de teren, confirmare participare, retragere târzie / sistem de onoare, contestare rezultat, corectare rezultat de către administrator, suspendare cont, punctaj de profil, validare dublă a rezultatului de către căpitani.

## Decizii de confirmat în echipă
- Rezervarea unui teren se confirmă automat dacă intervalul e liber, sau cere aprobarea administratorului de teren?
- Cine introduce rezultatul (US-14)?
- Valoarea rank-ului inițial, K și limitele variației (US-15).
- Leaderboard-ul filtrează pe sector (US-17), dar profilul jucătorului nu are un sector. De unde se ia?
