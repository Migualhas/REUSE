document
  .getElementById("cadastroForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const patrimonio = document.getElementById("patrimonio").value;
    const modelo = document.getElementById("modelo").value;
    const descricao = document.getElementById("descricao").value;
    const valor = document.getElementById("valor").value;
    const categoria = document.getElementById("categoria").value;

    // Envia os dados para o servidor
    fetch("http://localhost:3000/cadastro-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patrimonio: patrimonio,
        modelo: modelo,
        descricao: descricao,
        valor: valor,
        categoria: categoria,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("resultado").textContent =
            "Erro: " + data.error;
          document.getElementById("resultado").style.color = "red";
        } else {
          document.getElementById("resultado").textContent =
            "Item cadastrado com sucesso!";
          document.getElementById("resultado").style.color = "green";
        }
      })
      .catch((error) => {
        document.getElementById("resultado").textContent =
          "Erro: " + error.message;
        document.getElementById("resultado").style.color = "red";
      });
  });

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("logo");
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "http://localhost:3000/index.html";
    });
  }
});

document.getElementById("uploadForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData();
  const fileInput = document.getElementById("file");
  formData.append("file", fileInput.files[0]);

  fetch("http://localhost:3000/upload/excel", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao fazer upload do arquivo.");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("message").textContent = data.message;
      fileInput.value = ""; // Limpar o input após o envio
    })
    .catch((error) => {
      document.getElementById("message").textContent = error.message;
    });
});
document.getElementById('uploadForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Previne o comportamento padrão do formulário

  const formData = new FormData(this); // Cria um FormData com os dados do formulário

  // Faz a requisição para o servidor
  fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Erro ao enviar a imagem');
      }
      return response.text();
  })
  .then(data => {
      // Mostra a mensagem de sucesso
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = data; // Exibe a mensagem retornada do servidor
      messageDiv.style.display = 'block'; // Mostra a mensagem
      document.getElementById('uploadForm').reset(); // Reseta o formulário
  })
  .catch(error => {
      // Mostra uma mensagem de erro
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = error.message; // Exibe a mensagem de erro
      messageDiv.style.color = 'red'; // Muda a cor para vermelho
      messageDiv.style.display = 'block'; // Mostra a mensagem
  });
});

document.getElementById('imageUploadForm').addEventListener('submit', function(event) {
event.preventDefault(); // Previne o comportamento padrão do formulário

const formData = new FormData(this); // Cria um FormData com os dados do formulário

// Faz a requisição para o servidor
fetch('http://localhost:3000/upload', {
    method: 'POST',
    body: formData
})
.then(response => {
    if (!response.ok) {
        throw new Error('Erro ao enviar a imagem');
    }
    return response.text();
})
.then(data => {
    // Mostra a mensagem de sucesso
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.textContent = data; // Exibe a mensagem retornada do servidor
    messageDiv.style.display = 'block'; // Mostra a mensagem
    document.getElementById('imageUploadForm').reset(); // Reseta o formulário
})
.catch(error => {
    // Mostra uma mensagem de erro
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.textContent = error.message; // Exibe a mensagem de erro
    messageDiv.style.color = 'red'; // Muda a cor para vermelho
    messageDiv.style.display = 'block'; // Mostra a mensagem
});
});