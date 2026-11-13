/*
 * Arbeitsblatt zur Geschichten-Werkstatt. Ein Blatt je Raum,
 * die Blatt-Nr. legt die Auswahl fest (gleiche Nr. = gleiches Blatt).
 */
(async function () {
  "use strict";

  const K = window.Knobelkiste;
  const $ = function (id) { return document.getElementById(id); };
  const klasse = Number(K.parameter("klasse", "4"));
  $("zurueck-link").href = "index.html?klasse=" + klasse;

  let daten;
  try {
    daten = await K.ladeJSON("inhalte/deutsch/klasse-" + klasse + "/geschichten-werkstatt.json");
  } catch (e) {
    $("blatt").textContent = "Für Klasse " + klasse + " gibt es dieses Arbeitsblatt noch nicht.";
    return;
  }

  function escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  daten.raeume.forEach(function (r) {
    const opt = document.createElement("option");
    opt.value = r.nummer;
    opt.textContent = r.nummer + ". " + r.name;
    $("raum").appendChild(opt);
  });

  function neueNummer() { return 1000 + Math.floor(Math.random() * 9000); }
  $("raum").value = K.parameter("raum", "1");
  if (!$("raum").value) $("raum").value = "1";
  $("nummer").value = K.parameter("nr", String(neueNummer()));
  $("loesung").checked = K.parameter("loesung", "0") === "1";

  function loesungsText(text, loesung) {
    return loesung ? '<span class="loesung-text">' + escape(text) + "</span>" : "";
  }

  // ---- Raum 1: Sätze nummerieren ----
  function blattOrdnen(raum, zufall, loesung) {
    const geschichten = K.mischen(raum.aufgaben, zufall).slice(0, 2);
    let html = "";
    geschichten.forEach(function (g, gi) {
      const reihenfolge = K.mischen(g.saetze.map(function (_, i) { return i; }), zufall);
      html += '<section class="aufgabe"><h2><span class="nr">' + (gi + 1) + "</span>„" + escape(g.titel) +
        "“: Nummeriere die Sätze in der richtigen Reihenfolge.</h2><ul class=\"ordnen-liste\">";
      reihenfolge.forEach(function (i) {
        html += '<li><span class="nummer-kasten">' + loesungsText(String(i + 1), loesung) + "</span><span>" + escape(g.saetze[i]) + "</span></li>";
      });
      html += "</ul></section>";
    });
    html += '<section class="aufgabe"><h2><span class="nr">3</span>Schreibe eine der Geschichten mit einem eigenen, neuen Schluss auf.</h2>' +
      (loesung ? '<p class="loesung-text">Eigene Lösung. Der Schluss sollte zur Geschichte passen.</p>'
        : '<div class="schreib-linien"><div></div><div></div><div></div><div></div><div></div></div>') + "</section>";
    return html;
  }

  // ---- Raum 2: Satzzeichen eintragen ----
  function blattRede(raum, zufall, loesung) {
    const saetze = K.mischen(raum.aufgaben, zufall).slice(0, 8);
    let html = '<section class="aufgabe"><h2><span class="nr">1</span>Setze die fehlenden Satzzeichen ein.</h2>' +
      '<p class="regel">' + escape(raum.tipp) + "</p><ol class=\"blatt-saetze\">";
    saetze.forEach(function (a) {
      html += "<li>" + a.satz.split(/(\{[^}]*\})/).map(function (t) {
        if (t.charAt(0) === "{") return '<span class="luecke-blatt">' + (loesung ? escape(t.slice(1, -1)) : "&nbsp;") + "</span>";
        return escape(t);
      }).join("") + "</li>";
    });
    html += "</ol></section>" +
      '<section class="aufgabe"><h2><span class="nr">2</span>Schreibe zwei eigene Sätze mit wörtlicher Rede: einmal mit dem Begleitsatz vorne, einmal hinten.</h2>' +
      (loesung ? '<p class="loesung-text">Eigene Lösung. Auf Doppelpunkt, Komma und Anführungszeichen achten.</p>'
        : '<div class="schreib-linien"><div></div><div></div><div></div><div></div></div>') + "</section>";
    return html;
  }

  // ---- Raum 3: Wörter ersetzen ----
  function blattWoerter(raum, zufall, loesung) {
    const saetze = K.mischen(raum.aufgaben, zufall).slice(0, 8);
    const speicher = [];
    saetze.forEach(function (a) { speicher.push(a.optionen[0]); });
    // ein paar falsche Wörter dazu, damit nicht nur Passendes im Speicher steht
    saetze.slice(0, 4).forEach(function (a) { speicher.push(a.optionen[1]); });
    let html = '<section class="aufgabe"><h2><span class="nr">1</span>Ersetze das unterstrichene Wort durch ein treffendes Wort aus dem Wortspeicher.</h2>' +
      '<div class="wortspeicher"><strong>Wortspeicher (nicht alle Wörter passen):</strong>' +
      K.mischen(speicher.filter(function (w, i) { return speicher.indexOf(w) === i; }), zufall).map(function (w) { return "<span>" + escape(w) + "</span>"; }).join("") + "</div><ol class=\"blatt-saetze kompakt\">";
    saetze.forEach(function (a) {
      const t = a.satz.match(/^(.*)\[(.+?)\](.*)$/);
      html += "<li>" + escape(t[1]) + '<span class="alt-wort">' + escape(t[2]) + "</span>" + escape(t[3]) +
        ' → <span class="schreib-zeile">' + loesungsText(a.optionen[0], loesung) + "</span></li>";
    });
    html += "</ol></section>";
    return html;
  }

  function zeichnen() {
    const nummer = Math.max(1000, Math.min(9999, Number($("nummer").value) || 1000));
    const loesung = $("loesung").checked;
    const raum = daten.raeume.find(function (r) { return r.nummer === Number($("raum").value); });
    const zufall = K.zufallMitStartwert(nummer * 10 + raum.nummer);
    history.replaceState(null, "", "?klasse=" + klasse + "&raum=" + raum.nummer + "&nr=" + nummer + (loesung ? "&loesung=1" : ""));

    let inhalt;
    if (raum.typ === "reihenfolge") inhalt = blattOrdnen(raum, zufall, loesung);
    else if (raum.typ === "rede") inhalt = blattRede(raum, zufall, loesung);
    else inhalt = blattWoerter(raum, zufall, loesung);

    $("blatt").innerHTML =
      '<header class="blatt-kopf"><div><h1>Geschichten-Werkstatt</h1>' +
      (loesung ? '<span class="loesung-stempel">Lösung</span>' : "") + "</div>" +
      '<div class="klein">Knobelkiste · Deutsch Klasse ' + klasse + "<br>" + escape(raum.name) + " · Blatt-Nr. " + nummer + "</div></header>" +
      (loesung ? "" : '<div class="name-zeile"><span>Name:</span><span>Datum:</span></div>') + inhalt;
  }

  $("neu").addEventListener("click", function () {
    $("nummer").value = neueNummer();
    $("loesung").checked = false;
    zeichnen();
  });
  $("raum").addEventListener("change", zeichnen);
  $("nummer").addEventListener("change", zeichnen);
  $("loesung").addEventListener("change", zeichnen);
  $("drucken").addEventListener("click", function () { window.print(); });
  zeichnen();
})();
