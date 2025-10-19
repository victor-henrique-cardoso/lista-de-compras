/* script.js */

const listEl = document.getElementById('list');
const addForm = document.getElementById('addForm');
const itemName = document.getElementById('itemName');
const itemQty = document.getElementById('itemQty');
const itemPrice = document.getElementById('itemPrice');
const totalItems = document.getElementById('totalItems');
const activeItems = document.getElementById('activeItems');
const boughtItems = document.getElementById('boughtItems');
const totalCost = document.getElementById('totalCost');
const filter = document.getElementById('filter');
const search = document.getElementById('search');
const clearAll = document.getElementById('clearAll');
const clearBought = document.getElementById('clearBought');
const sortAlpha = document.getElementById('sortAlpha');
const sortAdded = document.getElementById('sortAdded');

let items = [];

// --- Formatação de dinheiro ---
function formatMoney(v) {
  return v == null ? '-' : 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

// --- Fetch do backend ---
async function load() {
  try {
    const res = await fetch('http://localhost:3000/itens');
    const data = await res.json();
    items = data.map(i => ({
      id: i.id,
      name: i.nome,
      qty: i.quantidade,
      price: i.preco,
      bought: !!i.comprado,
      createdAt: Date.now()
    }));
    render();
  } catch (e) {
    console.error('Erro ao carregar itens:', e);
  }
}

async function addItemToBackend(item) {
  const res = await fetch('http://localhost:3000/itens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: item.name,
      quantidade: item.qty,
      preco: item.price
    })
  });
  const data = await res.json();
  item.id = data.id;
}

async function updateItemBackend(item) {
  await fetch(`http://localhost:3000/itens/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quantidade: item.qty,
      preco: item.price,
      comprado: item.bought
    })
  });
}

async function deleteItemBackend(item) {
  await fetch(`http://localhost:3000/itens/${item.id}`, { method: 'DELETE' });
}

// --- Renderização ---
function render() {
  const q = search.value.trim().toLowerCase();
  const f = filter.value;

  listEl.innerHTML = '';

  const filtered = items.filter(it => {
    if (f === 'active' && it.bought) return false;
    if (f === 'bought' && !it.bought) return false;
    if (q && !it.name.toLowerCase().includes(q)) return false;
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="muted" style="padding:12px">Nenhum item encontrado.</div>';
    return;
  }

  filtered.forEach(it => {
    const div = document.createElement('div');
    div.className = 'item';

    const left = document.createElement('div');
    left.className = 'left';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = it.bought;

    const info = document.createElement('div');
    info.innerHTML = `<div class="name ${it.bought ? 'bought' : ''}">${it.name}</div>
                      <div class="muted">Qtd: <strong>${it.qty}</strong> • Preço: <strong>${it.price ? formatMoney(it.price) : '-'}</strong></div>`;

    left.appendChild(chk);
    left.appendChild(info);

    const right = document.createElement('div');
    right.className = 'actions';

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = 1;
    qtyInput.value = it.qty;

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = 0;
    priceInput.step = 0.01;
    priceInput.value = it.price || '';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Excluir';

    right.appendChild(qtyInput);
    right.appendChild(priceInput);
    right.appendChild(editBtn);
    right.appendChild(delBtn);

    div.appendChild(left);
    div.appendChild(right);
    listEl.appendChild(div);

    // Eventos
    chk.addEventListener('change', async () => {
      it.bought = chk.checked;
      await updateItemBackend(it);
      render();
    });

    qtyInput.addEventListener('change', async () => {
      it.qty = Math.max(1, Number(qtyInput.value) || 1);
      await updateItemBackend(it);
      render();
    });

    priceInput.addEventListener('change', async () => {
      it.price = priceInput.value ? Number(priceInput.value) : null;
      await updateItemBackend(it);
      render();
    });

    editBtn.addEventListener('click', async () => {
      const newName = prompt('Editar nome do item', it.name);
      if (newName !== null) {
        it.name = newName.trim() || it.name;
        await updateItemBackend(it);
        render();
      }
    });

    delBtn.addEventListener('click', async () => {
      if (confirm('Remover "' + it.name + '"?')) {
        await deleteItemBackend(it);
        items = items.filter(x => x.id !== it.id);
        render();
      }
    });
  });

  const total = items.length;
  const bought = items.filter(i => i.bought).length;
  const active = total - bought;
  const cost = items.reduce((s, i) => s + ((i.price ? Number(i.price) : 0) * i.qty), 0);

  totalItems.textContent = total;
  activeItems.textContent = active;
  boughtItems.textContent = bought;
  totalCost.textContent = formatMoney(cost);
}

// --- Adicionar item ---
document.getElementById('addBtn').addEventListener('click', async () => {
  const name = itemName.value.trim();
  if (!name) return itemName.focus();
  const qty = Math.max(1, Number(itemQty.value) || 1);
  const price = itemPrice.value ? Number(itemPrice.value) : null;

  const newItem = { name, qty, price, bought: false, createdAt: Date.now() };
  await addItemToBackend(newItem);
  items.unshift(newItem);

  itemName.value = '';
  itemQty.value = 1;
  itemPrice.value = '';
  render();
  itemName.focus();
});

// --- Filtros e pesquisa ---
filter.addEventListener('change', render);
search.addEventListener('input', render);

// --- Limpar toda a lista ---
clearAll.addEventListener('click', async () => {
  if (!confirm('Tem certeza que quer limpar toda a lista?')) return;

  // deletar todos itens do backend
  for (let item of items) {
    await deleteItemBackend(item);
  }
  items = [];
  render();
});

// --- Remover apenas comprados ---
clearBought.addEventListener('click', async () => {
  if (!confirm('Remover todos os itens marcados como comprados?')) return;

  const boughtItemsList = items.filter(i => i.bought);
  for (let item of boughtItemsList) {
    await deleteItemBackend(item);
  }
  items = items.filter(i => !i.bought);
  render();
});

// --- Ordenar A→Z ---
sortAlpha.addEventListener('click', () => {
  items.sort((a, b) => a.name.localeCompare(b.name));
  render();
});

// --- Ordenar por data de adição ---
sortAdded.addEventListener('click', () => {
  items.sort((a, b) => b.createdAt - a.createdAt);
  render();
});

// --- Iniciar ---
load();
