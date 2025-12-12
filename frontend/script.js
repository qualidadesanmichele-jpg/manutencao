// Backend URL auto-detect
const API = window.location.origin + "/api";

// User session
let currentUser = null;

// Load saved session
window.onload = () => {
    const saved = localStorage.getItem("user");
    if (saved) {
        currentUser = JSON.parse(saved);
        startApp();
    }
};

function login() {
    const u = document.getElementById("login-username").value.trim();
    const p = document.getElementById("login-password").value.trim();
    if (!u || !p) return showError("login-error", "Preencha todos os campos!");

    // Fake login (replace with API)
    const users = {
        "SamuelWaltrich": {role:"super_admin", pass:"11Dez2006"},
        "karla":{role:"admin", pass:"adm123456"},
        "fernanda":{role:"admin", pass:"adm123456"},
        "rosileine":{role:"admin", pass:"adm123456"},
        "joao.silva":{role:"technician", pass:"tecnico123"},
        "maria.santos":{role:"user", pass:"enfermeira123"}
    };

    if (!users[u] || users[u].pass !== p) return showError("login-error", "Usuário ou senha incorretos!");

    currentUser = {username:u, role:users[u].role};
    localStorage.setItem("user", JSON.stringify(currentUser));

    startApp();
}

function startApp() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");

    document.getElementById("user-name").innerText = currentUser.username;

    if (currentUser.role === "technician") {
        document.getElementById("tech-menu").classList.remove("hidden");
    }

    showPage("dashboard");
}

function logout() {
    localStorage.removeItem("user");
    location.reload();
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

// UI helpers
function showError(id, msg) {
    document.getElementById(id).innerText = msg;
}

// ▼ FAKE TICKETS (replace with backend later)
let tickets = [];

function createTicket() {
    const title = document.getElementById("ticket-title").value.trim();
    const desc = document.getElementById("ticket-desc").value.trim();
    if (!title || !desc) return showError("ticket-error", "Preencha todos os campos obrigatórios!");

    tickets.push({
        id: tickets.length + 1,
        title, desc,
        creator: currentUser.username,
        status:"open"
    });

    alert("Chamado criado!");
    showPage("my-tickets");
    loadMyTickets();
}

function loadMyTickets() {
    const list = document.getElementById("my-tickets-list");
    list.innerHTML = "";
    tickets.filter(t => t.creator === currentUser.username).forEach(t => {
        list.innerHTML += `<div class="ticket"><b>#${t.id}</b> ${t.title}<br>Status: ${t.status}</div>`;
    });
}

function loadTechnicianTickets() {
    if (currentUser.role !== "technician") return;
    const list = document.getElementById("tech-tickets-list");
    list.innerHTML = "";
    tickets.filter(t => t.status === "open").forEach(t => {
        list.innerHTML += `<div class="ticket"><b>#${t.id}</b> ${t.title}<br><button onclick="takeTicket(${t.id})">Atender</button></div>`;
    });
}

function takeTicket(id) {
    const t = tickets.find(x => x.id === id);
    t.status = "in-progress";
    alert("Chamado assumido!");
    loadTechnicianTickets();
}
