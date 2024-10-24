document.addEventListener("DOMContentLoaded", () => {
  // Carregar os itens do banco de dados
  fetch("http://localhost:3000/select/itens")
    .then((response) => response.json())
    .then((items) => {
      const itemsContainer = document.getElementById("itemsContainer");
      items.forEach((item) => {
        // Cria blocos de seleção de itens
        const itemBlock = document.createElement("div");
        itemBlock.classList.add("item-block");
        itemBlock.dataset.patrimonio = item.patrimonio;
        itemBlock.dataset.modelo = item.modelo;
        itemBlock.innerHTML = `
                    <h3>${item.modelo}</h3>
                    <p>Descrição: ${item.descricao}</p>
                    <p>Patrimônio: ${item.patrimonio}</p>
                `;
        itemBlock.addEventListener("click", () => {
          document
            .querySelectorAll(".item-block")
            .forEach((block) => block.classList.remove("selected"));
          itemBlock.classList.add("selected");
        });
        itemsContainer.appendChild(itemBlock);
      });
    })
    .catch((error) => console.error("Erro ao carregar itens:", error));
});

document.getElementById("sortearButton").addEventListener("click", function () {
  const selectedBlock = document.querySelector(".item-block.selected");

  if (!selectedBlock) {
    alert("Por favor, selecione um item.");
    return;
  }

  const { patrimonio } = selectedBlock.dataset;

  fetch(`http://localhost:3000/sorteio/${patrimonio}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // Adicione esta linha para verificar a resposta do servidor
      const resultadoElement = document.getElementById("resultado");
      resultadoElement.textContent = "";
    
      if (data.error) {
        resultadoElement.textContent = "Erro: " + data.error;
        resultadoElement.style.color = "red";
      } else if (data.message) {
        resultadoElement.textContent = data.message;
        resultadoElement.style.color = "orange";
    
        // Verifica se o vencedor não é undefined antes de mostrar o modal
        if (data.vencedor !== undefined) {
          showWinnerModal(data.vencedor);
        }
    
        setTimeout(() => {
          location.reload();
        }, 3000);
      } else {
        console.log('deu erradão');
      }
    })
    .catch((error) => {
      document.getElementById("resultado").textContent =
        "Erro: " + error.message;
      document.getElementById("resultado").style.color = "red";
    });
    
});

document.addEventListener("DOMContentLoaded", () => {
  // Fazer o fetch para a rota que retorna os vencedores já sorteados
  fetch("http://localhost:3000/ganhadores")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((winnersData) => {
      const tableBody = document
        .getElementById("winnersTable")
        .getElementsByTagName("tbody")[0];
      tableBody.innerHTML = ""; // Limpar a mensagem inicial de "nenhum vencedor"

      if (winnersData.length > 0) {
        winnersData.forEach((winner) => {
          const row = tableBody.insertRow();
          row.style.color = "#666666";

          // Inserir os dados dos vencedores
          row.insertCell(0).textContent = winner.nome_inscricao; // Nome do vencedor
          row.insertCell(1).textContent = winner.participante; // Matrícula
          row.insertCell(2).textContent = winner.aiu_inscricao; // Aiu ou Bzl (ou outro valor que represente isso)
          row.insertCell(3).textContent = winner.categoria; // Patrimônio
          row.insertCell(4).textContent = winner.modelo; // Modelo
          row.insertCell(5).textContent = winner.data_sorteio || "N/A"; // Data do sorteio
          row.insertCell(6).textContent = winner.horario_sorteio || "N/A"; // Horário do sorteio
        });
      } else {
        const row = tableBody.insertRow();
        row.insertCell(0).colSpan = 7; // Atualize para o número de colunas
        row.cells[0].textContent = "Nenhum vencedor encontrado.";
        row.cells[0].classList.add("no-winners");
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar vencedores:", error);
    });
});





// Função para mostrar o modal de vencedor
function showWinnerModal(vencedor) {
  const ganhadorModal = document.getElementById("ganhadorModal");
  const ganhadorMensagem = document.getElementById("ganhadorMensagem");
  ganhadorMensagem.textContent = `Parabéns! O vencedor é ${vencedor}.`;
  ganhadorModal.style.display = "block";
  
  setTimeout(() => {
    ganhadorModal.style.display = "none"; // Oculta o modal após 3 segundos
  }, 3000);
}
