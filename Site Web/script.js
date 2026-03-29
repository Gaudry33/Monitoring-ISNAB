const API = "a0a6a576d587407464f8dd1a481992540b8007c59189b6f194c988bedbdda17e";
const MAX_POINTS = 61;
const CLES = ["srv1.cpu.percent", "srv1.cpu.status", "srv1.disk.used", "srv1.disk.total", "ups.battery.charge", "ups.load", "ups.runtime"];

let donnees = { cpu: [], sante: [], disque: [], disqueTotal: [], batterie: [], chargeSortie: [], autonomie: [], heures: [] };
let graphiques = {};

// Communication avec Zabbix
async function zabbix(methode, params) {
    let reponse = await fetch("/zabbix/api_jsonrpc.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json-rpc', 'Authorization': 'Bearer ' + API },
        body: JSON.stringify({ jsonrpc: "2.0", method: methode, params: params, id: 1 })
    });
    let json = await reponse.json();
    return json.result || [];
}

// Graphiques
function initGraphiques() {
    Chart.defaults.color = '#8e8e8e';
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.line.borderWidth = 1;

    let configAxes = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 10, color: '#d8d9da' } } },
        scales: { x: { grid: { color: '#2c3235' } }, y: { grid: { color: '#2c3235' }, min: 0 } }
    };

    function creerGraphe(id, titre1, data1, couleur1, titre2, data2, couleur2) {
        let datasets = [{ label: titre1, data: data1, backgroundColor: couleur1, borderColor: couleur1, fill: true }];

        if (titre2) {
            datasets.push({ label: titre2, data: data2, backgroundColor: couleur2, borderColor: couleur2, fill: true });
        }

        return new Chart(document.getElementById(id), {
            type: 'line',
            data: { labels: donnees.heures, datasets: datasets },
            options: configAxes
        });
    }

    // Données des graphiques

    graphiques.cpu = creerGraphe('graphiqueSrvCpu', 'Utilisation CPU (%)', donnees.cpu, 'rgba(231, 76, 60, 0.9)');
    graphiques.disque = creerGraphe('graphiqueSrvSsd', 'Stockage Total (To)', donnees.disqueTotal, 'rgba(52, 152, 219, 0.3)', 'Utilisation (To)', donnees.disque, 'rgba(241, 196, 15, 0.9)');
    graphiques.onduleurInfo = creerGraphe('graphiqueOnduleurBatterie', 'Charge Batterie (%)', donnees.batterie, 'rgba(232, 67, 147, 0.8)', 'Charge de Sortie (%)', donnees.chargeSortie, 'rgba(0, 188, 140, 0.9)');
    graphiques.onduleurTemps = creerGraphe('graphiqueOnduleurAutonomie', 'Autonomie (min)', donnees.autonomie, 'rgba(52, 152, 219, 0.8)');
}

// Récupérer les historiques au chargement de la page
async function recupererHistorique(cleZabbix, division) {
    let sondes = await zabbix("item.get", { search: { key_: [cleZabbix] }, searchByAny: true, output: ["itemid", "value_type"] });
    if (sondes.length === 0) return [];

    let historique = await zabbix("history.get", {
        itemids: [sondes[0].itemid], history: sondes[0].value_type, sortfield: "clock", sortorder: "DESC", limit: MAX_POINTS
    });

    let resultat = [];

    for (let i = historique.length - 1; i >= 0; i--) {
        resultat.push(parseFloat(historique[i].value) / division);
    }

    while (resultat.length < MAX_POINTS) resultat.unshift(0);
    return resultat;
}

// Actualisation Globale (Premier chargement OU mise à jour)
async function actualiser(premierMode) {
    let sondes = await zabbix("item.get", { search: { key_: CLES }, searchByAny: true, output: ["key_", "lastvalue"] });
    if (sondes.length === 0) return;

    function lire(cle) {
        for (let i = 0; i < sondes.length; i++) {
            if (sondes[i].key_ === cle) return parseFloat(sondes[i].lastvalue);
        }
        return 0;
    }

    if (premierMode) {
        // --- CHARGEMENT HISTORIQUE ---
        for (let i = MAX_POINTS - 1; i >= 0; i--) {
            let d = new Date(); d.setSeconds(d.getSeconds() - (i * 10));
            donnees.heures.push(d.toLocaleTimeString('fr-FR'));
        }

        donnees.cpu = await recupererHistorique("srv1.cpu.percent", 1);

        let statsSante = await recupererHistorique("srv1.cpu.status", 1);
        for (let i = 0; i < statsSante.length; i++) {
            if (statsSante[i] === 2) donnees.sante.push(100);
            else donnees.sante.push(0);
        }

        let octetsTo = 1099511627776; // 1 To
        donnees.disque = await recupererHistorique("srv1.disk.used", octetsTo);
        donnees.disqueTotal = await recupererHistorique("srv1.disk.total", octetsTo);
        donnees.batterie = await recupererHistorique("ups.battery.charge", 1);
        donnees.chargeSortie = await recupererHistorique("ups.load", 1);
        donnees.autonomie = await recupererHistorique("ups.runtime", 60);

        graphiques.cpu.data.datasets[0].data = donnees.cpu;
        graphiques.disque.data.datasets[0].data = donnees.disqueTotal;
        graphiques.disque.data.datasets[1].data = donnees.disque;
        graphiques.onduleurInfo.data.datasets[0].data = donnees.batterie;
        graphiques.onduleurInfo.data.datasets[1].data = donnees.chargeSortie;
        graphiques.onduleurTemps.data.datasets[0].data = donnees.autonomie;
    } else {
        // Mise à jour en temps réel
        function ajouter(liste, valeur) { liste.shift(); liste.push(valeur); }

        ajouter(donnees.heures, new Date().toLocaleTimeString('fr-FR'));
        ajouter(donnees.cpu, Math.round(lire("srv1.cpu.percent")));

        let santeValeur = lire("srv1.cpu.status");
        if (santeValeur === 2) ajouter(donnees.sante, 100);
        else ajouter(donnees.sante, 0);

        let octetsTo = 1099511627776;
        ajouter(donnees.disque, lire("srv1.disk.used") / octetsTo);
        ajouter(donnees.disqueTotal, lire("srv1.disk.total") / octetsTo);
        ajouter(donnees.batterie, Math.round(lire("ups.battery.charge")));
        ajouter(donnees.chargeSortie, Math.round(lire("ups.load")));
        ajouter(donnees.autonomie, Math.round(lire("ups.runtime") / 60));
    }

    // Afichage du texte html
    let fin = MAX_POINTS - 1;
    document.getElementById("valSrvCpu").innerText = Math.round(donnees.cpu[fin]) + "%";
    document.getElementById("valSrvCpuSante").innerText = donnees.sante[fin] + "%";

    let pctDisque = 0;
    if (donnees.disqueTotal[fin] > 0) {
        pctDisque = Math.round((donnees.disque[fin] / donnees.disqueTotal[fin]) * 100);
    }
    document.getElementById("valSrvDisque").innerText = pctDisque + "%";
    document.getElementById("valSrvDisqueTotal").innerText = donnees.disqueTotal[fin].toFixed(1) + " To";

    document.getElementById("valOnduleurBatterie").innerText = donnees.batterie[fin] + "%";
    document.getElementById("valOnduleurSortie").innerText = donnees.chargeSortie[fin] + "%";
    document.getElementById("valOnduleurAutonomie").innerText = donnees.autonomie[fin] + " min";

    document.getElementById("logSyncTime").innerText = new Date().toLocaleTimeString('fr-FR');
    if (donnees.sante[fin] === 100) {
        document.getElementById("logSyncStatus").innerText = "SUCCÈS";
        document.getElementById("logSyncStatus").className = "couleur-vert";
    } else {
        document.getElementById("logSyncStatus").innerText = "ERREUR";
        document.getElementById("logSyncStatus").className = "couleur-rouge";
    }

    // Rafraichissement des graphiques
    graphiques.cpu.update();
    graphiques.disque.update();
    graphiques.onduleurInfo.update();
    graphiques.onduleurTemps.update();
}

// Lancement
async function lancement() {
    initGraphiques();
    await actualiser(true);

    // Heure en temps réel

    setInterval(function () { actualiser(false); }, 10000);
    setInterval(function () { document.getElementById("tempsreel").innerText = new Date().toLocaleTimeString('fr-FR'); }, 1000);
}

lancement();
