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
    const usuario_id = localStorage.getItem("usuario_id");
    if (!usuario_id) {
      alert("Faça login primeiro!");
      window.location.href = "index.html";
      return;
    }

    const res = await fetch(`http://localhost:3000/itens/${usuario_id}`);
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
  const usuario_id = localStorage.getItem("usuario_id");

  const res = await fetch('http://localhost:3000/itens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: item.name,
      quantidade: item.qty,
      preco: item.price,
      usuario_id: usuario_id
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
    // ... (lógica de filtragem existente) ...
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
        
        let tempQty = it.qty; 
        let tempPrice = it.price;
        let tempName = it.name; // Novo: Armazena o nome temporário

        const left = document.createElement('div');
        left.className = 'left';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = it.bought;

        const info = document.createElement('div');
        info.innerHTML = `<div class="name item-name ${it.bought ? 'bought' : ''}">${it.name}</div>
                          <div class="muted info-details">Qtd: <strong>${it.qty}</strong> • Preço: <strong>${it.price ? formatMoney(it.price) : '-'}</strong></div>`;

        left.appendChild(chk);
        left.appendChild(info);

        const right = document.createElement('div');
        right.className = 'actions';

        // --- Contêiner para os inputs de edição ---
        const editInputsContainer = document.createElement('div');
        editInputsContainer.className = 'edit-inputs';
        
        // NOVO: Input de Nome
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Nome do item';
        nameInput.value = it.name;
        
        // Input de Quantidade
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = 1;
        qtyInput.value = it.qty;
        qtyInput.style.width = '100px'; 
        
        // Input de Preço
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.min = 0;
        priceInput.step = 0.01;
        priceInput.value = it.price || '';
        priceInput.style.width = '100px'; 

        // Adiciona o campo de nome ao contêiner de edição
        editInputsContainer.appendChild(nameInput);
        editInputsContainer.appendChild(qtyInput);
        editInputsContainer.appendChild(priceInput);

        // ... (criação dos botões Salvar/Cancelar/Editar/Excluir) ...
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className = 'edit-btn'; 

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Salvar';
        saveBtn.className = 'save-btn'; 
        saveBtn.style.background = 'var(--good)'; 

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.className = 'save-btn'; 
        cancelBtn.style.background = 'var(--danger)'; // Estilo do Cancelar

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Excluir';

        const actionButtons = document.createElement('div');
        actionButtons.style.display = 'flex';
        actionButtons.style.gap = '6px';
        actionButtons.appendChild(saveBtn);
        actionButtons.appendChild(cancelBtn);
        
        const normalButtons = document.createElement('div');
        normalButtons.style.display = 'flex';
        normalButtons.style.gap = '6px';
        normalButtons.appendChild(editBtn);
        normalButtons.appendChild(delBtn);

        right.appendChild(editInputsContainer);
        right.appendChild(actionButtons);
        right.appendChild(normalButtons);
        
        div.appendChild(left);
        div.appendChild(right);
        listEl.appendChild(div);

        // --- Eventos de Ação ---

        // Alternar o modo de edição
        editBtn.addEventListener('click', () => {
            div.classList.add('editing'); 
            normalButtons.style.display = 'none'; 
            
            // Exibição dos campos e botões de ação
            editInputsContainer.style.display = 'flex';
            actionButtons.style.display = 'flex';
            
            // Garante que os inputs carreguem os valores atuais do item para edição
            nameInput.value = it.name; // NOVO
            qtyInput.value = it.qty;
            priceInput.value = it.price || '';
            
            // Armazena os originais para o cancelamento
            tempName = it.name;
            tempQty = it.qty; 
            tempPrice = it.price; 
            nameInput.focus(); // Foca no campo de nome
        });
        
        // Salvar as mudanças de nome, quantidade e preço
        saveBtn.addEventListener('click', async () => {
            // Sair do modo de edição
            div.classList.remove('editing'); 
            editInputsContainer.style.display = 'none';
            actionButtons.style.display = 'none';
            normalButtons.style.display = 'flex';

            // NOVO: Coleta o nome
            const newName = nameInput.value.trim();
            const newQty = Math.max(1, Number(qtyInput.value) || 1);
            const newPrice = priceInput.value ? Number(priceInput.value) : null;

            // Verifica se houve mudança em qualquer campo
            if (it.name !== newName || it.qty !== newQty || it.price !== newPrice) {
                // Se o nome estiver vazio, mantém o nome antigo ou define um placeholder
                it.name = newName || it.name || 'Item sem nome'; 
                it.qty = newQty;
                it.price = newPrice;
                await updateItemBackend(it);
            }
            
            // Atualiza o texto de informação na lista
            info.querySelector('.item-name').textContent = it.name;
            info.querySelector('.info-details').innerHTML = `Qtd: <strong>${it.qty}</strong> • Preço: <strong>${it.price ? formatMoney(it.price) : '-'}</strong>`;
            render(); // Renderiza para atualizar o custo total e o estado visual
        });
        
        // Cancelar a edição
        cancelBtn.addEventListener('click', () => {
            // Sai do modo de edição
            div.classList.remove('editing'); 
            editInputsContainer.style.display = 'none';
            actionButtons.style.display = 'none';
            normalButtons.style.display = 'flex';

            // Opcional: Reverter os inputs para os valores originais em caso de cancelamento
            nameInput.value = tempName; // NOVO
            qtyInput.value = tempQty; 
            priceInput.value = tempPrice || '';
        });
        
        // Evento de Comprado (checkbox)
        chk.addEventListener('change', async () => {
          it.bought = chk.checked;
          await updateItemBackend(it);
          render();
        });

        // Evento de Excluir
        delBtn.addEventListener('click', async () => {
          if (confirm('Remover "' + it.name + '"?')) {
            await deleteItemBackend(it);
            items = items.filter(x => x.id !== it.id);
            render();
          }
        });
        
        // NOTA: Removido o evento 'editBtn.addEventListener('click', ...)' anterior que usava prompt().
    });

    // ... (restante da função render) ...
    const total = items.length;
    const bought = items.filter(i => i.bought).length;
    const active = total - bought;
    const cost = items.reduce((s, i) => s + ((i.price ? Number(i.price) : 0) * i.qty), 0);

    totalItems.textContent = total;
    activeItems.textContent = active;
    boughtItems.textContent = bought;
    totalCost.textContent = formatMoney(cost);
  };

  // ... (cálculo de totais e atualização dos elementos de resumo) ...
  const total = items.length;
  const bought = items.filter(i => i.bought).length;
  const active = total - bought;
  const cost = items.reduce((s, i) => s + ((i.price ? Number(i.price) : 0) * i.qty), 0);

  totalItems.textContent = total;
  activeItems.textContent = active;
  boughtItems.textContent = bought;
  totalCost.textContent = formatMoney(cost);


// --- Adicionar item ---
document.getElementById('addBtn').addEventListener('click', async () => {
  const name = itemName.value.trim();
  if (!name) return itemName.focus();
  const qty = Math.max(1, Number(itemQty.value) || 1);
  const price = itemPrice.value ? Numblister(itemPrice.value) : null;
list
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
