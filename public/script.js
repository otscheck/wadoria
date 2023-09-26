// Récupérer les données depuis le serveur Express et les insérer dans le tableau HTML
fetch('/toutes-les-donnees')
.then(response => response.json())
.then(data => {
    const dataTable = document.getElementById('data-table');
    data.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.id}</td>
            <td>${entry.timestamp}</td>
            <td>${entry.received_data}</td>
            <td>${entry.name_data}</td>
        `;
        dataTable.appendChild(row);
    });
})
.catch(error => {
    console.error('Erreur lors de la récupération des données : ', error);
});