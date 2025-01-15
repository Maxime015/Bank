  // Définition de chartData
  let chartData = {
    labels: [],
    datasets: [{
        label: 'Soldes Bancaires',
        data: [],
        backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
    }]
};


 // Fonction pour mettre à jour les données du graphique
 function updateChartData() {
    chartData.labels = listAccount.map(compte => compte.nom);
    chartData.datasets[0].data = listAccount.map(compte => compte.solde);
    myChart.update();
}

        
function updateChartType() {
    const selectedType = document.getElementById('chartType').value;
    myChart.destroy(); // Destroy the old chart
    myChart = createChart(selectedType);
}

// Création initiale du graphique
let myChart = createChart('bar'); 

function createChart(type, height = 400) {
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.innerHTML = `<canvas id="myChart"></canvas>`;
    canvasContainer.style.height = `${height}px`;

    const ctx = document.getElementById('myChart').getContext('2d');
    return new Chart(ctx, {
        type: type,
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const { datasetIndex, index } = activeElements[0];
                    removeData(datasetIndex, index);
                }
            },
            tooltips: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

function removeData(datasetIndex, index) {
    if (chartData.labels.length > index) {
        chartData.labels.splice(index, 1);
        chartData.datasets[datasetIndex].data.splice(index, 1);
        myChart.update();
    }
}






function obtenirDonneesPourGraphique() {
    const labels = listAccount.map(compte => `${compte.nom}`);
    const soldes = listAccount.map(compte => compte.solde);

    return { labels, soldes };
}

class CompteBancaire {
    constructor(id, nom, prenom, profession, typeCompte) {
        this.id = id;
        this.nom = nom;
        this.prenom = prenom;
        this.profession = profession;
        this.typeCompte = typeCompte;
        this.solde = 0;
        this.historique = [];
    }

    retrait(montant) {
        if (isNaN(montant) || montant <= 0) {
            alert("Montant invalide. Veuillez entrer un nombre positif.");
            return;
        }
        this.solde -= montant;
        this.historique.push({ type: 'notification', montant, solde: this.solde });
        this.mettreAJourAffichage();
        this.afficherGraphique();
        updateChartData(); // Mettre à jour les données du graphique après chaque modification
        NotificationManager.afficherNotification(`Votre compte a été débité de ${montant}.`, 'warning');
        NotificationManager.verifierNotifications(this);
    }

    debiter(montant) {
        if (isNaN(montant) || montant <= 0) {
            alert("Montant invalide. Veuillez entrer un nombre positif.");
            return false;
        }
        if (montant > this.solde) {
            alert("Fonds insuffisants.");
            return false;
        }
        this.solde -= montant;
        this.historique.push({ type: 'Débit', montant, solde: this.solde });
        updateChartData(); // Mettre à jour les données du graphique après chaque modification
        this.mettreAJourAffichage();
        NotificationManager.afficherNotification(`Votre compte a été débité de ${montant}.`, 'warning');
        NotificationManager.verifierNotifications(this);
        return true;
    }

    mettreAJourAffichage() {
        const compteDiv = document.querySelector(`.compte[data-id="${this.id}"]`);
        if (compteDiv) {
            compteDiv.querySelector(".solde").textContent = `Solde: ${this.solde}$`;
            compteDiv.querySelector(".description").textContent = `Ce compte appartient à ${this.nom} ${this.prenom} et contient un montant de ${this.solde}$`;
        }
    }

    crediter(montant) {
        if (isNaN(montant) || montant <= 0) {
            alert("Montant invalide. Veuillez entrer un nombre positif.");
            return;
        }
        this.solde += montant;
        this.historique.push({ type: 'notification', montant, solde: this.solde });
        this.mettreAJourAffichage();
        this.afficherGraphique();
        updateChartData(); // Mettre à jour les données du graphique après chaque modification
    
        if (montant > 5000) {
            NotificationManager.afficherNotification(`Dépôt de ${montant}$ effectué avec succès sur votre compte ${this.nom}.`, 'success');
        }
    
        NotificationManager.verifierNotifications(this);
    }
    
    transaction(idRecepteur) {
        const montantAEnvoyer = Number(prompt("Entrer le montant à envoyer"));
        if (isNaN(montantAEnvoyer) || montantAEnvoyer <= 0) {
            alert("Montant invalide. Veuillez entrer un nombre positif.");
            return;
        }
    
        const frais = this.calculerFrais(montantAEnvoyer);
        const montantTotal = montantAEnvoyer + frais;
    
        if (!this.debiter(montantTotal)) {
            alert("Transaction annulée.");
            return;
        }
    
        const receveur = listAccount.find(compte => compte.id === idRecepteur);
    
        if (receveur) {
            receveur.crediter(montantAEnvoyer);
            this.historique.push({ type: 'notification', montant: montantAEnvoyer, solde: this.solde });
            NotificationManager.afficherNotification(`***Transaction de ${montantAEnvoyer}$ réussie vers le compte ${receveur.nom}.***`, 'success-transfer');
        } else {
            alert("Le compte du destinataire n'existe pas.");
            this.crediter(montantTotal); // Remboursement en cas d'erreur
        }
        this.mettreAJourAffichage(); // Mettre à jour le graphique après la transaction
    
        NotificationManager.verifierNotifications(this);
    }
    

    calculerFrais(montant) {
        const fraisMap = {
            "Basic": 0.05,
            "Premium": 0.03,
            "Luxe": 0.02
        };
        return montant * (fraisMap[this.typeCompte] || 0);
    }

    afficherGraphique() {
        const { labels, soldes } = obtenirDonneesPourGraphique();
    
        const chartOptions = {
            chart: {
                type: 'area',
                height: 180,
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            colors: ['#3498db'],
            series: [{ name: 'Solde', data: soldes }],
            dataLabels: { enabled: false },
            stroke: { width: 3, curve: 'smooth' },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: labels,
                axisBorder: { show: false },
                labels: { style: { colors: '#a7a7a7', fontFamily: 'Poppins' } }
            },
            yaxis: { show: false },
            grid: {
                borderColor: 'rgba(0, 0, 0, 0)',
                padding: { top: -30, bottom: -8, left: 12, right: 12 }
            },
            tooltip: {
                enabled: true,
                y: { formatter: value => `${value}$` },
                style: { fontFamily: 'Poppins' }
            },
            markers: { show: false }
        };
    
        const chartElement = document.querySelector('.chart-area');
        if (chartElement) {
            // Assurez-vous que la bibliothèque ApexCharts est chargée avant de créer le graphique
            if (typeof ApexCharts !== 'undefined') {
                const chart = new ApexCharts(chartElement, chartOptions);
                chart.render();
            } else {
                console.error('ApexCharts est requis pour afficher les graphiques.');
            }
        }
    }
}



class NotificationManager {
    static verifierNotifications(compte) {
        const seuilSoldeFaible = 5000;
        const seuilTransactionElevee = 1000000;

        if (compte.solde < seuilSoldeFaible) {
            this.afficherNotification(`Attention, le solde de votre compte ${compte.nom} est inférieur à ${seuilSoldeFaible}$`, 'warning');
        }

        const derniereTransaction = compte.historique[compte.historique.length - 1];
        if (derniereTransaction && derniereTransaction.montant > seuilTransactionElevee && derniereTransaction.type === 'Débit') {
            this.afficherNotification(`Alerte, une transaction de ${derniereTransaction.montant}$ a été effectuée sur votre compte ${compte.nom}.`, 'alert');
        }
    }

    static afficherNotification(message, type) {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `notification ${type}`;
        notificationDiv.textContent = message;

        document.body.appendChild(notificationDiv);

        // Ajouter une animation pour l'apparition de la notification
        setTimeout(() => {
            notificationDiv.classList.add('show');
        }, 10);

        setTimeout(() => {
            notificationDiv.classList.remove('show');
            setTimeout(() => {
                notificationDiv.remove();
            }, 500); // Délai pour la disparition de la notification
        }, 5000); // Supprimer la notification après 5 secondes
    }
}

let listAccount = [];

const comptesListe = document.querySelector(".Account");
const Ajouter = document.querySelector(".Add");

// Ajouter un compte
Ajouter.addEventListener("click", () => {
    const nom = prompt("Entrer votre nom").trim();
    const prenom = prompt("Entrer votre prénom").trim();
    const profession = prompt("Entrer votre profession").trim();
    let typeCompte = prompt("À quel type de compte souscrivez-vous?\n1- Basic\n2- Premium\n3- Luxe").trim();

    while (!["1", "2", "3"].includes(typeCompte)) {
        typeCompte = prompt("Type de compte invalide. Veuillez choisir entre:\n1- Basic\n2- Premium\n3- Luxe").trim();
    }

    const listTypeCompte = {
        "1": "Basic",
        "2": "Premium",
        "3": "Luxe"
    };

    listAccount.push(new CompteBancaire(listAccount.length + 1, nom, prenom, profession, listTypeCompte[typeCompte]));
    Affichage();
    updateChartData(); // Mettre à jour les données du graphique après chaque modification
});

//----------------------------------------------------------

function Affichage() {
    comptesListe.innerHTML = "";

    listAccount.forEach(compte => {
        const divCompte = document.createElement("div");
        divCompte.className = `compte ${compte.typeCompte.toLowerCase()}`;
        divCompte.setAttribute("data-id", compte.id);

        divCompte.innerHTML = `
            <div class="blob"></div>
            <div class="container">
                <div class="categorie">${compte.typeCompte}</div>
                <div class="logo-image"></div>
                <article>ID: ${compte.id}</article>
                <article>Nom: ${compte.nom}</article>
                <article>Prénom: ${compte.prenom}</article>
                <article>Profession: ${compte.profession}</article>
                <article>Type de Compte: ${compte.typeCompte}</article>
                <article class="solde">Solde: ${compte.solde}$</article>
                <article class="description">Ce compte appartient à ${compte.nom} ${compte.prenom} et contient un montant de ${compte.solde}$</article>
                
                <div class="bouton">
                    <button class="retrait">Débiter</button>
                    <button class="transaction">Transférer</button>
                    <button class="crediter">Créditer</button>
                    <button class="decrire">Description</button>
                    <button class="supprimer">Supprimer</button>
                    <button class="modifier">Modifier</button>
                </div>
            </div>
        `;

        comptesListe.appendChild(divCompte);

        divCompte.querySelector(".retrait").addEventListener("click", () => {
            const montant = Number(prompt("Quel est le montant du retrait ?"));
            if (isNaN(montant) || montant <= 0) {
                alert("Montant invalide. Veuillez entrer un nombre positif.");
                return;
            }
            compte.retrait(montant);
        });

        divCompte.querySelector(".crediter").addEventListener("click", () => {
            const montant = Number(prompt("Quel est le montant du crédit?"));
            if (isNaN(montant) || montant <= 0) {
                alert("Montant invalide. Veuillez entrer un nombre positif.");
                return;
            }
            compte.crediter(montant);
        });

        divCompte.querySelector(".decrire").addEventListener("click", () => {
            alert(`Ce compte appartient à ${compte.nom} ${compte.prenom} et contient un montant de ${compte.solde}$`);
        });

        divCompte.querySelector('.modifier').addEventListener("click", () => {
            modifierCompte(compte);
        });

        divCompte.querySelector('.supprimer').addEventListener("click", () => {
            supprimerCompte(compte.id);
        });

        divCompte.querySelector('.transaction').addEventListener("click", () => {
            const iddestinataire = Number(prompt("Entrer l'ID du destinataire"));
            if (isNaN(iddestinataire) || iddestinataire <= 0) {
                alert("ID invalide. Veuillez entrer un nombre positif.");
                return;
            }
            compte.transaction(iddestinataire);
        });

    });
}

//----------------------------------------------------------
// Modifier le compte
function modifierCompte(compte) {
    const type = parseInt(prompt("Que voulez-vous modifier?\n1- Nom\n2- Prénom\n3- Profession"), 10);
    let nouvelleValeur;

    switch (type) {
        case 1:
            nouvelleValeur = prompt("Entrer le nouveau nom").trim();
            compte.nom = nouvelleValeur;
            break;
        case 2:
            nouvelleValeur = prompt("Entrer le nouveau prénom").trim();
            compte.prenom = nouvelleValeur;
            break;
        case 3:
            nouvelleValeur = prompt("Entrer la nouvelle profession").trim();
            compte.profession = nouvelleValeur;
            break;
        default:
            alert("Choix invalide.");
            return;
    }
    Affichage();
    updateChartData(); // Mettre à jour les données du graphique après chaque modification
    afficherGraphique(); // Mettre à jour le graphique après modification
}

// Supprimer un compte
function supprimerCompte(id) {
    listAccount = listAccount.filter(compte => compte.id !== id);
    Affichage();
    updateChartData(); // Mettre à jour les données du graphique après chaque modification
    afficherGraphique(); // Mettre à jour le graphique après suppression
}

document.getElementById('exporter').addEventListener('click', () => {
    exporterDonneesExcel();
});

function exporterDonneesExcel() {
    const data = listAccount.flatMap(compte => {
        return compte.historique.map(trans => {
            return {
                ID: compte.id,
                Nom: compte.nom,
                Prénom: compte.prenom,
                Profession: compte.profession,
                'Type de Compte': compte.typeCompte,
                'Type de Transaction': trans.type,
                Montant: trans.montant,
                Solde: trans.solde
            };
        });
    });

    // Afficher toutes les informations de `data` dans la console
    console.log("Données exportées :");
    data.forEach(entry => {
        console.log(entry);
    });

    NotificationManager.afficherNotification(`* Exportation réussie des données vers Excel !`, 'exportation');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historique des Transactions");

    XLSX.writeFile(wb, "Historique_Transactions.xlsx");
}

