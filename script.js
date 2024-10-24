var modal = document.getElementById("rulesModal");
var btn = document.getElementById("rulesButton");
var span = document.getElementsByClassName("close")[0];
var check = document.getElementById("checkButton");

document.addEventListener("DOMContentLoaded", () => {
    const logo = document.getElementById("logo");
    if (logo) {
        logo.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

        // Função para abrir o modal
        function openModal() {
            document.getElementById('rulesModal').style.display = 'block';
        }
    
        // Função para fechar o modal
        function closeModal() {
            document.getElementById('rulesModal').style.display = 'none';
        }
    
        // Abre o modal quando o botão for clicado
        document.getElementById('rulesButton').onclick = function() {
            openModal();
        }
    
        // Fecha o modal quando o usuário clica no "x"
        document.querySelector('.close').onclick = function() {
            closeModal();
        }
    
        // Fecha o modal se o usuário clicar fora do conteúdo do modal
        window.onclick = function(event) {
            if (event.target == document.getElementById('rulesModal')) {
                closeModal();
            }
        }


// Adicione um evento de clique ao botão de confirmação
checkButton.addEventListener('click', verificarSelecao);

    fetch("http://localhost:3000/select/itens")
        .then((response) => response.json())
        .then((data) => {
            const categories = {};
            const subscriptions = document.getElementById("subscriptions");
            const itemsSection = document.getElementById("items");
            // Função para remover a mensagem se existir
            const removeMessage = () => {
                const messageDiv = document.getElementById("message-container");
                if (messageDiv) {
                    itemsSection.removeChild(messageDiv);
                }
            };

            // Check if there are no items
            if (data.length === 0) {
                const messageDiv = document.createElement("div");
                messageDiv.id = "message-container"; // Assign an ID for future reference
                messageDiv.classList.add("message-container");
                messageDiv.textContent = "Nenhum item inscrito por enquanto.";
                itemsSection.appendChild(messageDiv);
                return; // Exit the function early since there's no data to process
            } else {
                // Se há itens, remova a mensagem
                removeMessage();
            }

            data.forEach((item) => {
                const patrimonio = item.patrimonio;
                const modelo = item.modelo;
                const descricao = item.descricao;
                const valor = item.valor;
                const imagem = item.patrimonio;
                // Usa o nome da imagem retornado pelo servidor
                const imagePath = `../foto_itens/${imagem}.png`; 

                const categoria = item.categoria.toLowerCase();

                if (!categories[categoria]) {
                    categories[categoria] = document.createElement("div");
                    categories[categoria].classList.add("categoria");

                    const categoryHeader = document.createElement("div");
                    categoryHeader.classList.add("category-header");

                    const categoryCheckbox = document.createElement("input");
                    categoryCheckbox.type = "checkbox";
                    categoryCheckbox.addEventListener("change", function () {
                        const itemCards = categories[categoria].itemList.querySelectorAll(".item-card");
                        itemCards.forEach((card) => {
                            if (this.checked) {
                                if (!card.classList.contains("selected")) {
                                    card.click();
                                }
                            } else {
                                if (card.classList.contains("selected")) {
                                    card.click();
                                }
                            }
                        });
                    });

                    categoryHeader.appendChild(categoryCheckbox);

                    const categoryTitle = document.createElement("h2");
                    categoryTitle.textContent = categoria;
                    categoryHeader.appendChild(categoryTitle);

                    categories[categoria].appendChild(categoryHeader);

                    const itemList = document.createElement("div");
                    itemList.classList.add("item-list");
                    categories[categoria].appendChild(itemList);
                    categories[categoria].itemList = itemList;
                }

                const itemCard = document.createElement("div");
                itemCard.classList.add("item-card");

                itemCard.addEventListener("click", function () {
                    this.classList.toggle("selected");
                    const subscriptionCard = document.querySelector(
                        `.subscription-card[data-patrimonio="${patrimonio}"]`
                    );
                    if (this.classList.contains("selected")) {
                        if (!subscriptionCard) {
                            const newSubscriptionCard = document.createElement("div");
                            newSubscriptionCard.classList.add("subscription-card");
                            newSubscriptionCard.dataset.patrimonio = patrimonio;
                            newSubscriptionCard.innerHTML = `<span class="trash-icon"><i class="fas fa-trash"></i></span><p class="patrimonio">${patrimonio}</p><p>${modelo}</p>`;
                            subscriptions.appendChild(newSubscriptionCard);

                            newSubscriptionCard.addEventListener("click", function () {
                                const itemCard = document.querySelector(
                                    `.item-card[data-patrimonio="${this.dataset.patrimonio}"]`
                                );
                                if (itemCard) {
                                    itemCard.click();
                                }
                            });
                        }
                    } else {
                        if (subscriptionCard) {
                            subscriptions.removeChild(subscriptionCard);
                        }
                    }
                });

                itemCard.dataset.patrimonio = patrimonio;
                itemCard.innerHTML += `
                    <div class="item-content">
                        <img src="${imagePath}" alt="${modelo}" class="item-image">
                        <div class="item-details">
                            <p class="identificador">${patrimonio}</p>
                            <h3 class="title">${modelo}</h3>
                            <p class="descricao">${descricao}<br></p>
                            <p class="valor">R$ ${valor}</p>
                            
                        </div>
                        
                    </div>
                    `; 
                categories[categoria].itemList.appendChild(itemCard);
            });

            
            for (const category in categories) {
                itemsSection.appendChild(categories[category]);
            }

            document.getElementById("submitButton").addEventListener("click", function (e) {
    e.preventDefault();

    let nome_completo = document.getElementById("name").value;
    let matricula = document.getElementById("registration").value;
    let aiu = document.getElementById("aiu").value;

    // Função para verificar se a matrícula já está cadastrada
    const verificarMatricula = (matricula) => {
        return fetch(`http://localhost:3000/check-matricula?matricula=${matricula}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Erro ao verificar matrícula.");
                }
                return response.json();
            })
            .then((data) => {
                return data.cadastrada; // Assume que a API retorna { cadastrada: true/false }
            });
    };

    // Mostrar mensagem no canto do site
    const mostrarMensagem = (mensagem) => {
        let msgDiv = document.createElement("div");
        msgDiv.className = "mensagem";
        msgDiv.innerText = mensagem;
        document.body.appendChild(msgDiv);
        setTimeout(() => {
            msgDiv.remove();
        }, 3000); // Remove a mensagem após 3 segundos
    };

    verificarMatricula(matricula)
        .then((cadastrada) => {
            if (cadastrada) {
                mostrarMensagem("Esta matrícula já está cadastrada.");
                return; // Bloqueia o envio se a matrícula já estiver cadastrada
            }

            let data = {
                matricula: matricula,
                nome_completo: nome_completo,
                aiu: aiu,
            };

            const enviarItens = () => {
                let subscriptionCards = document.querySelectorAll(".subscription-card");
                let itemPromises = [];
                let itensEscolhidos = [];
            
                // Exibir o pop-up de carregamento
                const loadingPopup = document.getElementById('loadingPopup');
                loadingPopup.style.display = 'flex'; // Mostra o pop-up
            
                subscriptionCards.forEach((card) => {
                    let item = card.getAttribute("data-patrimonio");
                    let itemData = {
                        participante: matricula,
                        item: item,
                        nome_inscricao: nome_completo,
                        aiu_inscricao: aiu,
                    };
            
                    let itemPromise = fetch("http://localhost:3000/insert/Inscricao", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(itemData),
                    })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((data) => {
                        console.log("Sucesso:", data);
                    })
                    .catch((error) => {
                        console.error("Erro:", error);
                        alert("Ocorreu um erro ao enviar os itens: " + error);
                        // Retorne uma promessa rejeitada se ocorrer um erro
                        return Promise.reject(error);
                    });
            
                    itemPromises.push(itemPromise);
            
                    // Obter informações do item escolhido
                    let itemCard = document.querySelector(`.item-card[data-patrimonio="${item}"]`);
                    let modelo = itemCard.querySelector(".title").textContent;
                    let descricao = itemCard.querySelector(".descricao").textContent;
                    let valor = itemCard.querySelector(".valor").textContent;
            
                    itensEscolhidos.push({
                        patrimonio: item,
                        modelo: modelo,
                        descricao: descricao,
                        valor: valor,
                    });
                });
            
                return Promise.all(itemPromises)
                    .then(() => {
                        // Enviar e-mail com informações dos itens escolhidos
                        return fetch("http://localhost:3000/send-email", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                nome_completo: nome_completo,
                                email: aiu,
                                matricula: matricula,
                                itensEscolhidos: itensEscolhidos,
                            }),
                        });
                    })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Erro ao enviar e-mail.");
                        }
                        return response.text();
                    })
                    .then((responseText) => {
                        console.log(responseText);
                        alert("Envio realizado com sucesso! Todos os dados foram enviados."); // Mensagem de sucesso unificada
                        location.reload(); // Recarrega a página após o envio bem-sucedido
                    })
                    .catch((error) => {
                        console.error("Erro ao enviar os dados:", error);
                        alert("Erro ao enviar os dados. Por favor, tente novamente.");
                    })
                    .finally(() => {
                        loadingPopup.style.display = 'none'; // Oculta o pop-up ao final do processo
                    });
            };
            

            fetch("http://localhost:3000/insert/participante", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("Sucesso:", data);
                return enviarItens();
            })
            .catch((error) => {
                console.error("Erro:", error);
                alert("Ocorreu um erro ao enviar os dados. Ou você já foi inscrito ou talvez ganhou nas edições passadas. Contate a TI.");
            });
        })
        .catch((error) => {
            console.error("Erro na verificação da matrícula:", error);
        });
});

            
        });
});
function showPopup(message) {
    const popup = document.getElementById('customPopup');
    const popupMessage = document.getElementById('popupMessage');
    
    popupMessage.textContent = message; // Define a mensagem do pop-up
    popup.style.display = 'block'; // Exibe o pop-up
    
    // Fecha o pop-up quando o botão de fechar é clicado
    document.getElementById('closePopupButton').onclick = function () {
        popup.style.display = 'none';
    };

    // Fecha o pop-up quando o "X" é clicado
    document.querySelector('.close-popup').onclick = function () {
        popup.style.display = 'none';
    };

    // Fecha o pop-up se o usuário clicar fora do conteúdo do pop-up
    window.onclick = function (event) {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    };
}
        // Selecione o botão de confirmação
        const checkButton = document.getElementById('checkButton');

        // Selecione os campos que precisam ser exibidos
        const form = document.getElementById('form');
        const subscriptionsSection = document.getElementById('subscriptions-section');
        const buttom = document.getElementById('checkButton')
        // Selecione o container de itens
        const itemsContainer = document.getElementById('items');
        
        // Função para verificar se algum item foi selecionado
        function verificarSelecao() {
            // Verifique se algum item foi selecionado
            const selectedItem = itemsContainer.querySelector('.selected');
        
            // Se algum item foi selecionado, exiba os campos
            if (selectedItem) {
                form.style.display = 'block';
                subscriptionsSection.style.display = 'block';
                buttom.style.display = 'none'
                
            } else {
                alert('Selecione um item antes de prosseguir.');
            }
        }