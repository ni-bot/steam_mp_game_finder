export type ChangelogEntry = {
  version: string;
  commit: string;
  title: { de: string; en: string };
  bullets: { de: string[]; en: string[] };
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "0.1",
    commit: "1940002cc20b82f80e0d078f848761d9b77e71c1",
    title: {
      de: "Erste Version",
      en: "First release",
    },
    bullets: {
      de: [
        "Steam-Bibliotheken mit Freunden vergleichen",
        "Fokus auf Mehrspieler-Spiele, die alle besitzen",
        "Mehrere Freunde gleichzeitig auswählbar",
        "Design an die Steam-Oberfläche angelehnt",
      ],
      en: [
        "Compare Steam libraries with friends",
        "Focus on multiplayer games everyone owns",
        "Select multiple friends at once",
        "Steam-inspired interface design",
      ],
    },
  },
  {
    version: "0.2",
    commit: "04c500a7bf85cceccafce3853ae6da78476a1dcd",
    title: {
      de: "Stabileres Hosting",
      en: "More reliable hosting",
    },
    bullets: {
      de: [
        "Deployment auf Vercel läuft wieder zuverlässig",
      ],
      en: [
        "Deployment on Vercel works reliably again",
      ],
    },
  },
  {
    version: "0.3",
    commit: "8555f41baf269a77ed4314e4ccc87e37c7462eeb",
    title: {
      de: "Steam-Anmeldung repariert",
      en: "Steam sign-in fixed",
    },
    bullets: {
      de: [
        "Anmeldung mit Steam funktioniert wieder wie erwartet",
      ],
      en: [
        "Signing in with Steam works as expected again",
      ],
    },
  },
  {
    version: "0.4",
    commit: "b4e8818c11888e8042330c6fb960d8d5be22aae2",
    title: {
      de: "„Fast alle besitzen es“-Modus",
      en: "“Almost everyone owns it” mode",
    },
    bullets: {
      de: [
        "Neuer Vergleichsmodus: ein Spiel fehlt nur bei einer Person",
        "Umschaltbar in den Ergebnis-Einstellungen",
      ],
      en: [
        "New match mode: only one person is missing a game",
        "Toggle in the results settings",
      ],
    },
  },
  {
    version: "0.5",
    commit: "c4fb049fdcdceb36b371127a2fd7e593961d86fe",
    title: {
      de: "Schieberegler für den Modus",
      en: "Slider for match mode",
    },
    bullets: {
      de: [
        "Der „fast alle“-Modus nutzt jetzt einen Schieberegler statt einer Checkbox",
      ],
      en: [
        "The near-match mode now uses a slider instead of a checkbox",
      ],
    },
  },
  {
    version: "0.6",
    commit: "7f371db96d234fb39f502a501291f371a8b6ae1c",
    title: {
      de: "Freundesliste übersichtlicher",
      en: "Clearer friend list",
    },
    bullets: {
      de: [
        "Steam-IDs in der Freundesliste besser lesbar",
        "Freunde nach Profil gruppiert",
      ],
      en: [
        "Steam IDs are easier to read in the friend list",
        "Friends grouped by profile",
      ],
    },
  },
  {
    version: "0.7",
    commit: "d0b372bd297b8ca3fda3991a774e9a3114710df5",
    title: {
      de: "Sortieren ohne Neuladen",
      en: "Sort without reloading",
    },
    bullets: {
      de: [
        "Sortierung der Ergebnisse passiert sofort im Browser",
        "Button „Vergleichen“ steht zentriert in der Kopfzeile",
      ],
      en: [
        "Results sort instantly in the browser",
        "Compare button centered in the header",
      ],
    },
  },
  {
    version: "0.8",
    commit: "9362ac503e31e7b4f764809dad521d37497c0901",
    title: {
      de: "Schneller bei vielen Freunden",
      en: "Faster with large friend lists",
    },
    bullets: {
      de: [
        "Profildaten werden gebündelt geladen – auch bei langen Freundeslisten",
        "Steam-IDs in Namen dezent hervorgehoben",
      ],
      en: [
        "Profile data loads in batches for long friend lists",
        "Steam IDs shown subtly in names",
      ],
    },
  },
  {
    version: "0.9",
    commit: "ffc7000deec51ada31ae3be00a7e55b8a2b74be3",
    title: {
      de: "Profil-URL immer erreichbar",
      en: "Profile URL always within reach",
    },
    bullets: {
      de: [
        "Eingabe für Steam-Profil-URLs bleibt unten in der Seitenleiste sichtbar",
      ],
      en: [
        "Steam profile URL input stays pinned at the bottom of the sidebar",
      ],
    },
  },
  {
    version: "0.10",
    commit: "1ceb06a1ab5f52d9c319ecf39e23614c38a0b9d8",
    title: {
      de: "Sortierung vereinfacht",
      en: "Simpler sorting",
    },
    bullets: {
      de: [
        "Sortierung nach „zuletzt gespielt“ entfernt",
        "Weniger unnötige Daten beim Vergleich",
      ],
      en: [
        "Removed “recently played” sort option",
        "Less unused data during compare",
      ],
    },
  },
  {
    version: "0.11",
    commit: "0c6ccd89826af683766c0f3aeea3429195c9ed85",
    title: {
      de: "Ergebnisliste scrollt wieder",
      en: "Results list scrolls properly",
    },
    bullets: {
      de: [
        "Lange Ergebnislisten lassen sich wieder durchscrollen",
      ],
      en: [
        "Long result lists scroll correctly again",
      ],
    },
  },
  {
    version: "0.12",
    commit: "303019335a447742325c17abd942c26c75c334b1",
    title: {
      de: "Scrollleisten im Steam-Look",
      en: "Steam-style scrollbars",
    },
    bullets: {
      de: [
        "Scrollleisten passen zu Seite und Spielkarten",
        "Ohne Pfeil-Buttons – cleaner Look",
      ],
      en: [
        "Scrollbars match the page and game cards",
        "No arrow buttons for a cleaner look",
      ],
    },
  },
  {
    version: "0.13",
    commit: "7c0bb995e2bd1f57253d3f8b25bd17a1352b0bd0",
    title: {
      de: "Zwei Farb-Themen",
      en: "Two color themes",
    },
    bullets: {
      de: [
        "Wechsel zwischen Steam-Store- und Steam-Client-Optik im Benutzermenü",
      ],
      en: [
        "Switch between Steam Store and Steam Client looks in the user menu",
      ],
    },
  },
  {
    version: "0.14",
    commit: "20d1331733effe88eade5d3ed796531310a62182",
    title: {
      de: "Kleine Textkorrektur",
      en: "Small text fix",
    },
    bullets: {
      de: [
        "Hinweistext zum „fast alle“-Modus auf Deutsch korrigiert",
      ],
      en: [
        "Fixed German hint text for near-match mode",
      ],
    },
  },
  {
    version: "0.15",
    commit: "bd96fae228cb3779373cb7076cbbe8471340718c",
    title: {
      de: "Hellmodus und neue Themennamen",
      en: "Light mode and new theme names",
    },
    bullets: {
      de: [
        "Hellmodus per Schalter im Benutzermenü",
        "Themes heißen jetzt Hafen und Hain",
      ],
      en: [
        "Light mode toggle in the user menu",
        "Themes renamed to Harbor and Grove",
      ],
    },
  },
  {
    version: "0.16",
    commit: "b2211fb53aa9933c242b89dcbc821921d6ad16c0",
    title: {
      de: "App-Symbol",
      en: "App icon",
    },
    bullets: {
      de: [
        "Favicon und App-Icons passend zum Hafen-Theme",
      ],
      en: [
        "Favicon and app icons matching the Harbor theme",
      ],
    },
  },
  {
    version: "0.17",
    commit: "7e0b0fc64b14cc59e1d087d748d728cd2b699799",
    title: {
      de: "Filter: Wer soll kaufen?",
      en: "Filter: who should buy?",
    },
    bullets: {
      de: [
        "Im „fast alle“-Modus: anzeigen, wer das Spiel noch nicht hat",
      ],
      en: [
        "In near-match mode: see who is still missing the game",
      ],
    },
  },
  {
    version: "0.18",
    commit: "1aa4af88222a045d30f5477715877e29556e7d2e",
    title: {
      de: "Nur Mehrspieler-Spiele",
      en: "Multiplayer games only",
    },
    bullets: {
      de: [
        "Filter in den Ergebnissen: nur Mehrspieler-Kategorien anzeigen",
        "Ein- und ausschaltbar",
      ],
      en: [
        "Results filter: show multiplayer categories only",
        "Can be toggled on and off",
      ],
    },
  },
  {
    version: "0.19",
    commit: "c8b8641daecca34248725394f612ad2f0d7dfcf5",
    title: {
      de: "Freunde per Schalter wählen",
      en: "Pick friends with toggles",
    },
    bullets: {
      de: [
        "Checkboxen durch Schalter-Zeilen ersetzt",
        "Ausgewählte Freunde mit hervorgehobenem Avatar",
      ],
      en: [
        "Checkboxes replaced with toggle rows",
        "Selected friends get a highlighted avatar",
      ],
    },
  },
  {
    version: "0.20",
    commit: "c6dccf6ddfdb8359d1490a8e450ee94be5b7c415",
    title: {
      de: "Gruppierung nach Bibliothek",
      en: "Group by library visibility",
    },
    bullets: {
      de: [
        "Freundesliste nach öffentlicher, privater oder ungeprüfter Bibliothek gruppiert",
      ],
      en: [
        "Friend list grouped by public, private, or unchecked library",
      ],
    },
  },
  {
    version: "0.21",
    commit: "3d5086312a9567ac7b8830540fc7e6126ebbb1db",
    title: {
      de: "Lade-Fortschritt für Freunde",
      en: "Friend loading progress",
    },
    bullets: {
      de: [
        "Modal zeigt echten Fortschritt beim Laden der Freundesliste",
        "Live-Updates per Server-Sent Events",
      ],
      en: [
        "Modal shows real progress while loading friends",
        "Live updates via Server-Sent Events",
      ],
    },
  },
  {
    version: "0.22",
    commit: "067153b481b11ad88c8b781df3ee5fa6087e6272",
    title: {
      de: "Schnellerer Vergleich",
      en: "Faster compare",
    },
    bullets: {
      de: [
        "Bibliotheken aus dem Cache wiederverwendet",
        "Store-Metadaten werden im Hintergrund vorgeladen",
      ],
      en: [
        "Reuses cached library data from startup",
        "Store metadata preloaded in the background",
      ],
    },
  },
  {
    version: "0.23",
    commit: "a8a4984b43e58a372abee947e06410c3666c3831",
    title: {
      de: "Steam-Shop im Spiel",
      en: "Steam store in-app",
    },
    bullets: {
      de: [
        "Spielkarte anklicken öffnet ein Store-Modal mit Steam-Widget",
        "Link zum vollständigen Store-Eintrag",
      ],
      en: [
        "Click a game card to open a store modal with Steam widget",
        "Link to the full store page",
      ],
    },
  },
  {
    version: "0.24",
    commit: "f5ecbce8783fee889e87a2d005e112677baa88ed",
    title: {
      de: "Versionshistorie",
      en: "Version history",
    },
    bullets: {
      de: [
        "„Änderungen“ im Benutzermenü öffnet eine Übersicht aller Versionen",
        "Einträge auf Deutsch und Englisch, neueste zuerst",
      ],
      en: [
        "“Changes” in the user menu opens a list of all releases",
        "Entries in German and English, newest first",
      ],
    },
  },
  {
    version: "0.25",
    commit: "50d2b292115bcf8ec4dc46e1758711c9f05c222c",
    title: {
      de: "Changelog vervollständigt",
      en: "Changelog completed",
    },
    bullets: {
      de: [
        "Eintrag für Version 0.24 in der Versionshistorie ergänzt",
      ],
      en: [
        "Added the missing v0.24 entry in the version history",
      ],
    },
  },
  {
    version: "0.26",
    commit: "212f7b35b6fa3ce41c211ca3fbe448bc3dece846",
    title: {
      de: "Stabilerer Deploy-Build",
      en: "More reliable deploy builds",
    },
    bullets: {
      de: [
        "Build auf Vercel schlägt nicht mehr wegen der Changelog-Prüfung fehl",
        "Funktioniert auch bei flachem Git-Clone auf dem Hosting",
      ],
      en: [
        "Vercel builds no longer fail on the changelog check",
        "Works with shallow git clones on the host",
      ],
    },
  },
  {
    version: "0.27",
    commit: "88ee885064948318b9892aafce8b27fd71156391",
    title: {
      de: "Changelog vervollständigt",
      en: "Changelog completed",
    },
    bullets: {
      de: [
        "Einträge für Version 0.25 und 0.26 in der Versionshistorie ergänzt",
      ],
      en: [
        "Added v0.25 and v0.26 entries in the version history",
      ],
    },
  },
  {
    version: "0.28",
    commit: "3b5856ef7dffb6513bd6396c8927332259a91bb4",
    title: {
      de: "Mehr Lade-Sprüche",
      en: "More loading tips",
    },
    bullets: {
      de: [
        "30 neue Sprüche beim Laden der Freundesliste",
        "Steam-Kultur-Humor auf Deutsch und Englisch",
      ],
      en: [
        "30 new tips while loading your friend list",
        "Steam-culture humor in German and English",
      ],
    },
  },
];
