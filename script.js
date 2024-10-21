const sheetID = '1kD1m82eKe7lO7BUlU-KisnCmREGJig8SF_7GFxtg7gw'; 
const apiKey = 'AIzaSyDYnae9ehXc1-jhXpoBzTT8BYobwBkQbU8';

let chartInstances = {};
let apiData = null;

// Функция для получения данных из Google Sheets
async function fetchData(month) {
    const range = `'${month}'!A:H`; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${range}?key=${apiKey}`;

    const loaderElement = document.getElementById('loader');
    
    if (loaderElement) {
        loaderElement.style.display = 'block';
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        apiData = data.values; 
        updateCategoryCharts(); 
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    } finally {
        if (loaderElement) {
            loaderElement.style.display = 'none';
        }

        document.getElementById('ordersChart').style.display = 'block';
        document.getElementById('revenueChart').style.display = 'block';
        document.getElementById('avgCheckChart').style.display = 'block';
        document.getElementById('sellersChart').style.display = 'block';
    }
}


// Функция для фильтрации данных по товарам и категориям
function filterData(searchTerm) {
    if (!apiData) return [];

    // Фильтрация по товарам (первый столбец) и категориям (столбцы 2-4)
    return apiData.slice(1).filter(row => {
        const productName = row[0].toLowerCase();
        const category1 = row[1].toLowerCase();
        const category2 = row[2].toLowerCase();
        const category3 = row[3].toLowerCase();

        return (
            productName.includes(searchTerm.toLowerCase()) ||
            category1.includes(searchTerm.toLowerCase()) ||
            category2.includes(searchTerm.toLowerCase()) ||
            category3.includes(searchTerm.toLowerCase())
        );
    });
}

// Функция для применения фильтров
function applyFilters() {
    const searchTerm = document.getElementById('searchTerm').value;
    const monthFilter = document.getElementById('monthFilter').value;

    fetchData(monthFilter).then(() => {
        const filteredData = filterData(searchTerm);
        renderCharts(filteredData); // Передаем фильтрованные данные
    });
}


// Функция для сортировки данных по убыванию
function sortDataByValue(data, index) {
    return data.slice().sort((a, b) => parseFloat(b[index]) - parseFloat(a[index]));
}

// Функция для группировки данных по категориям
function groupDataByCategory() {
    const groupedData = {};

    apiData.slice(1).forEach(row => {
        const category = row[1]; // Категория - 2 столбец
        if (!groupedData[category]) {
            groupedData[category] = {
                orders: 0,
                revenue: 0,
                avgCheck: 0,
                sellers: 0,
                count: 0
            };
        }

        groupedData[category].orders += parseInt(row[4]);
        groupedData[category].revenue += parseFloat(row[5]);
        groupedData[category].avgCheck += parseFloat(row[6]);
        groupedData[category].sellers += parseInt(row[7]);
        groupedData[category].count += 1;
    });

    // Вычисляем средний чек для каждой категории
    for (let category in groupedData) {
        groupedData[category].avgCheck /= groupedData[category].count;
    }

    return groupedData;
}

// Функция для рендера графиков
function renderCharts() {
    const groupedData = groupDataByCategory();

    // Удаляем старые графики, если они уже существуют
    if (chartInstances.ordersChart) chartInstances.ordersChart.destroy();
    if (chartInstances.revenueChart) chartInstances.revenueChart.destroy();
    if (chartInstances.avgCheckChart) chartInstances.avgCheckChart.destroy();
    if (chartInstances.sellersChart) chartInstances.sellersChart.destroy();

    const sortedCategories = Object.keys(groupedData)
        .sort((a, b) => groupedData[b].orders - groupedData[a].orders)
        .slice(0, 5); // Берем только топ-5 категорий

    const labels = sortedCategories;
    const orders = sortedCategories.map(category => groupedData[category].orders);
    const revenue = sortedCategories.map(category => groupedData[category].revenue);
    const avgCheck = sortedCategories.map(category => groupedData[category].avgCheck);
    const sellers = sortedCategories.map(category => groupedData[category].sellers);

    // График заказов
    const ordersCtx = document.getElementById('ordersChart').getContext('2d');
    chartInstances.ordersChart = new Chart(ordersCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Количество заказов',
                data: orders,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                hoverBackgroundColor: 'rgba(75, 192, 192, 0.6)',
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

    // График выручки
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    chartInstances.revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Выручка',
                data: revenue,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
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

    // График среднего чека
    const avgCheckCtx = document.getElementById('avgCheckChart').getContext('2d');
    chartInstances.avgCheckChart = new Chart(avgCheckCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Средний чек',
                data: avgCheck,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
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

    // График количества продавцов
    const sellersCtx = document.getElementById('sellersChart').getContext('2d');
    chartInstances.sellersChart = new Chart(sellersCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Количество продавцов',
                data: sellers,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
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


// Функция для обновления графиков по категориям
function updateCategoryCharts() {
    if (apiData) {
        renderCharts(); // Если данные загружены, рендерим графики
    }
}

// Начальная загрузка
window.onload = () => {
    const initialMonth = document.getElementById('monthFilter').value;
    fetchData(initialMonth);
};
