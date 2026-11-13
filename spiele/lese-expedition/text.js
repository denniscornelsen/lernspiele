/* Zerlegt einen Absatz in Sätze. Wird von Spiel und Arbeitsblatt genutzt. */
window.LeseText = {
  saetze: function (absatz) {
    // Trennen nach . ! ? (auch vor schließendem Anführungszeichen),
    // wenn danach ein neuer Satz mit Großbuchstaben oder „ beginnt.
    return absatz.split(/(?<=[.!?]“?)\s+(?=[A-ZÄÖÜ„])/);
  }
};
