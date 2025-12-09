# Käyttöohje

## Johdanto
Tämä käyttöohje opastaa sinua sovelluksen käytössä. Ohjeessa selitetään perustoiminnot, kuten käynnistäminen ja tiedostojen lataaminen, sekä kuinka voit luoda raportteja analysoiduista tiedoista.

---

## 1. Sovelluksen käynnistäminen
Käynnistä sovellus terminaalissa seuraavalla komennolla:
```bash
  npm run dev
```
Sovellus avautuu selaimessasi automaattisesti osoitteeseen:  http://localhost:5173

---
## 2.Tiedostojen lataaminen
- Jos olet aiemmin ladannut kansion sovellukseen, sovellus muistaa sen automaattisesti. 
- Muussa tapauksessa painaa “**Valitse kansio**” – painiketta aloittaaksesi kansion lataaminen.
  - Saat käyttöoikeuspyynnön. Valitse  “**Allow**” (Salli)
  
    <img src="public/images/allow.png" alt= "allow to edit files" width="300">

- Ladattu kansion nimi näkyy näytöllä. Kansion nimen oikealla puolella on “**Poista**”-painike, jolla voit poistaa ladatun kansion.
    
  <img src="public/images/folderName.png" alt="folder name" width="400">

- Ladattujen tiedostojen määrä lasketaan  ja näytetään automaattisesti.
  
  <img src="public/images/fileCount.png" alt="folder count" width="700">
    
---

## 3. Tiedostojen haku 
### 3.1 Haku nimen perusteella
  
  <img src="public/images/searchForm.png" alt="serch form" width="300">

Voit etsiä tiedostoja nimen perusteella.

- Kirjoita asiakkaan etunimi tai sukunimi tai molemmat hakukenttään. 

- Paina “**Hae**”-painiketta.

### 3.2 Turvahaku (Safe search)

<img src="public/images/safeSearch.png" alt="safe search choose box" width="70">

- Valittuna: Asiakkaan nimi ei näy kokonaan, vaan ensimmäinen kirjain.
- Ei valittuna: Asiakkaan koko nimi näytetään.
---

## 4. Tiedostojen suodatus ja valinta

Kaikki istunnot ja niihin liittyvät tiedostot näytetään luettelossa.

  <img src="public/images/sessionList.png" alt="session list" width="700">

### 4.1 Tiedostojen suodatus

Voit lajitella ja suodattaa tiedostoja eri kriteerien mukaan:
- **Istunto:** Päivämäärän ja/tai ajan mukaan (Uusimmat, Vanhimmat).
- **Jalka:** vasen, oikea
- **Nopeus:** 60/60, 240/240, 30/30, 30/300, 180/180
- **Ohjelma:** kons/kons, eks/eks, CPM/eks

**Valitse suodatus**: Klikkaa pudotusvalikkoa (esim. "Ohjelma") ja valitse haluamasi tyyppi. Valittu tyyppi näkyy otsikon "Ohjelma" alapuolella.

**Poista suodatus**: Avaa pudotusvalikko uudelleen ja poista valinta painamalla otsikkoa.

 <img src="public/images/programType.png" alt="types of program" width="300">

Jos jokin suodatus on valittuna, "Tyhjennä suodatus"-painike muuttuu punaiseksi. Klikkaamalla sitä poistat kaikki valitut suodattimet.

  <img src="public/images/clearFilter.png" alt="clear all filters" width="300">

### 4.2 Tiedostojen valinta ja poista avalinnasta
-	Voit valinta kaikki istunnon tiedostot klikkaamalla valintaruutua istunnon nimen vasemmalla puolella.
Kun kaikki tiedostot on valittu, Istunnon nimen edessä valintaruutu  näytetään:
    
      <img src="public/images/selectedAll.png" alt="selected all of session" width="150">

  - Yksittäisen tiedoston voi valita klikkaamalla sen valintaruutua.
         Kun vain osa tiedostoista on valittu, Istunnon nimen edessä valintaruutu näytetään: 

    <img src="public/images/selectedPart.png" alt="selected part of session" width="150">
 
### 4.3 Valinnan poistaminen
Kun tiedostoja valittuna, “**Sulje valitut tiedostot**” -painike muuttuu punaiseksi.

  <img src="public/images/clearFilter.png" alt="session list" width="320">

 -	Yksittäisen/Istunnon valinnan poisto: Klikkaa valintaruutua uudelleen.
 -	Kaikki valinnat poisto: Klikkaa “**Sulje valitut tiedostot**”-painiketta.
 
Kun olet valinnut tiedostot, sulje ikkuna siirtyäksesi tiedostojen analysointiin.

---
## 5. Analyysisivun ohjauspaneeli
### 5.1 Tiedostot ja tulostus

  <img src="public/images/filesPrintButtons.png" alt="files and print buttons" width="200">

-	**Tiedostot**: Avaa ikkuna, josta voit ladata, suodattaa ja valinta lisää tiedostoja analyysiä varten.
-	**Tulosta**: Luo tulostettavan PDF-raportin nykyisestä analyysinäkymästä(sisältää kaaviot ja valitut parametrit)

### 5.2 Tietojen näyttöasetukset

  <img src="public/images/filterErrorBansSelectBox.png" alt="filter and error bans select box" width="300">

-	Käytä valintaruutuja määrittääksesi, mitä tietoja graafikuvassa näytetäään.
     -	**Suodata tiedot**: Suodattaa (tasoittaa) raakadataa, jotta kaavioiden luettavuuden parantamiseksi.
     -	**Näytä virhealueet**: Näyttää varjostetut virhemarginaalit piirrosviivojen ympärillä.
     - 
### 5.3 Valittujen tiedostojen poistaminen
-	**Sulje tiedostot** -painike:
     -	Kun osoitin painikkeen päälle, se muuttuu punaiseksi.
-	Klikkaamalla painiketta poistat kaikki valitut käsiteltävät tiedostot ja avaa automaattisesti tiedostonvalintaikkunan uudelleen.

  <img src="public/images/closeFiles.png" alt="close all files" width="300">

### 5.4 Ohjelmatyypin valinta

  <img src="public/images/programTypesButtons.png" alt="program type buttons" width="300">

  Valittujen tiedostojen ohjelmatyypit näkyvät painikkeina. Voit valita, mikä ohjelmatyypin haluat näyttää kaaviossa, klikkaamalla vastaavaa painiketta.
 

### 5.5 Valittujen tiedostojen näyttö ja hallinta

  <img src="public/images/selectedFiles.png" alt="selected files" width="300">

Kaksi osiota (Vasen ja Oikea) sisältävät tiedostot.
- Jokaisella tiedostolla on oma värimerkintä (piste).
- "**x**"-painikkeella voit poistaa tiedoston analyysista.
- Valittu tiedosto korostetaan (tummemmalla taustalla).

### 5.6 Toistojen valinta
Valitun tiedoston yksityiskohdat
- Tiedoston nimi ja aika (esim. "CTM380.CTM 16:30").
- Lista toistoista (esim. 1, 2, 3) valintaruutuina

Toistot voi näyttää tai piilottaa valintaruudun avulla.

  <img src="public/images/repetitions.png" alt="repetition selection" width="250">
