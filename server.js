const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

let tasks = []; // Array para armazenar as tarefas

// Variável para rastrear o último ID atribuído
let lastTaskId = 0;

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "Siga este prompt = Seu nome é BotList e fale para o usuário: Digite a tarefa que você precisa fazer, o dia, o horário e o nível de importância. E você não deve responder coisas que não têm a ver com as tarefas do usuário, você não deve adicionar tarefas que o usuário não disse, e você deve manter todas as tarefas do usuário na sua memória, você só deve deletar uma tarefa da memória se o usuário falar" }],
      },
      {
        role: "model",
        parts: [{ text: ""}],
      },
      {
        role: "user",
        parts: [{ text: "Siga este prompt = Todas as tarefas validas que o usuário te enviar guarde na sua memoria, para quando ele quiser saber quais são as tarefas dele, e mostre todas as tarefas dele em ordem de importancia de alta para baixa" }],
      },
      {
        role: "model",
        parts: [{ text: ""}],
      },
      {
        role: "user",
        parts: [{ text: "Siga este prompt = Quando o usuário adicionar uma tarefa responda que a tarefa foi adicionada e se ele quiser ver as tarefas adicionadas fale para ele escrever para você listas as tarefas adicionadas" }],
      },
      {
        role: "model",
        parts: [{ text: ""}],
      },
      {
        role: "user",
        parts: [{ text: "Decore todas as tarefas adiconadas pelo usuário: "+ JSON.stringify(tasks) }],
      },
      {
        role: "model",
        parts: [{ text: "Ok"}],
      },
      {
        role: "user",
        parts: [{ text: "Olá" }],
      },
      {
        role: "model",
        parts: [{ text: "Oi! Fico feliz em te ajudar com suas tarefas! Para que eu possa te auxiliar da melhor maneira, me diga qual tarefa você precisa fazer, o dia, o horário e o nível de importância. Lembre-se: Só posso te ajudar com tarefas que você me pedir explicitamente. Não criarei tarefas que você não mencionar. Armazenarei todas as suas tarefas na minha memória, e você pode consultá-las a qualquer momento. Só removerei tarefas da sua lista se você me pedir para fazer isso. Estou pronto para te ajudar a organizar sua vida! Se quiser adicionar umaa tarefa você precisa escrever a tarefa, o dia, o horário e o nível de importância dela. "}],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Adicionar tarefa
app.post('/add-task', async (req, res) => {
  try {
    const task = req.body?.task;
    console.log('incoming /add-task req', task);
    if (!task) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Incrementar o ID da tarefa
    lastTaskId++;
    task.id = lastTaskId;

    tasks.push(task); // Adicionar a nova tarefa ao array
    console.error(tasks);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error in add-task endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Remover tarefa
app.post('/remove-task', async (req, res) => {
  try {
    const taskId = parseInt(req.body?.taskId); // Convertendo o ID para número inteiro
    
    console.log('incoming /remove-task req', taskId);
    if (!taskId) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    tasks = tasks.filter(task => task.id !== taskId); // Remover a tarefa do array
    res.sendStatus(200);
  } catch (error) {
    console.error('Error in remove-task endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Endpoint para listar todas as tarefas
app.get('/tasks', (req, res) => {
  try {
    res.json(tasks);
  } catch (error) {
    console.error('Error in tasks endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
