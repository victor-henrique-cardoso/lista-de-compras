// Cadastro
async function cadastro() {
  const nome = document.getElementById("cadNome").value;
  const email = document.getElementById("cadEmail").value;
  const senha = document.getElementById("cadSenha").value;

  const res = await fetch("http://localhost:3000/cadastro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha })
  });

  const data = await res.json();
  console.log(data); // ver o que voltou

  if (data.usuario_id) {
    localStorage.setItem("usuario_id", data.usuario_id); // salva ID
    window.location.href = "/home/victor/Documentos/testaJS/lista.html"; // entra direto no site
  } else {
    alert(data.msg || data.erro);
  }
}



// Login
async function login() {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  const res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  });

  const data = await res.json();
  if (data.usuario_id) {
    localStorage.setItem("usuario_id", data.usuario_id); // salva ID do usuário
    window.location.href = "lista.html"; // abre a tela da lista
  } else {
    alert(data.erro);
  }
}
