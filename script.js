const sheetID = '1kD1m82eKe7lO7BUlU-KisnCmREGJig8SF_7GFxtg7gw'; // Замените на ID вашей таблицы
const apiKey = 'AIzaSyDYnae9ehXc1-jhXpoBzTT8BYobwBkQbU8'; // Замените на ваш Google API ключ

let chartInstances = {};
let apiData = null;

// Функция для получения данных из Google Sheets
function fetchData(month) {
    const range = `'${month}'!A:H`; // Указание месяца для диапазона
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${range}?key=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            apiData = data;
            updateCharts(); // Обновляем графики после загрузки данных
        })
        .catch(error => console.error('Ошибка при получении данных:', error));
}

// Функция для обновления графиков
function updateCharts() {
    const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();
    const productFilter = document.getElementById('productFilter').value.toLowerCase();

    const orders = [];
    const revenue = [];
    const avgCheck = [];
    const labels = [];

    // Пропустим первую строку, так как это заголовки
    apiData.values.slice(1).forEach(row => {
        const productName = row[0].toLowerCase();
        const categoryName = row[1].toLowerCase();

        // Применение фильтров для категории и товара
        if ((categoryFilter === '' || categoryName.includes(categoryFilter)) &&
            (productFilter === '' || productName.includes(productFilter))) {
            labels.push(row[0]); // Название товара
            orders.push(Number(row[4])); // Количество заказов
            revenue.push(Number(row[5])); // Выручка
            avgCheck.push(Number(row[6].replace(',', '.'))); // Средний чек
        }
    });

    renderChart('ordersChart', 'Количество заказов', labels, orders);
    renderChart('revenueChart', 'Выручка', labels, revenue);
    renderChart('avgCheckChart', 'Средний чек', labels, avgCheck);
}

// Функция для рендеринга графиков
function renderChart(canvasId, label, labels, data) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy(); // Уничтожаем старый график
    }
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type: canvasId === 'avgCheckChart' ? 'line' : 'bar', // Линейный график для среднего чека
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: canvasId === 'avgCheckChart' ? 'rgba(153, 102, 255, 0.2)' : 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Применение фильтров и обновление графиков
document.querySelector('.btn').addEventListener('click', () => {
    const monthFilter = document.getElementById('monthFilter').value;
    fetchData(monthFilter); // Обновляем данные в зависимости от месяца
});

// Загрузка данных для выбранного месяца при загрузке страницы
window.onload = () => {
    const initialMonth = document.getElementById('monthFilter').value;
    fetchData(initialMonth);
};
