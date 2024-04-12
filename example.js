
import fs from 'fs'
import { Stream } from 'stream'

async function codellama() {
  const llamaindex = await import('llamaindex')
  const { Ollama, Document, Refine, ResponseSynthesizer, StreamingResponseBuilder, VectorStoreIndex, serviceContextFromDefaults, HuggingFaceEmbedding } = llamaindex
  const ollamaLLM = new Ollama({ baseURL: 'http://localhost:11434', model: 'codellama' })
  const embedLLM = new HuggingFaceEmbedding({ modelType: 'Xenova/all-mpnet-base-v2' })
  const serviceContext = serviceContextFromDefaults({ llm: ollamaLLM, embedModel: embedLLM })


  const data = fs.readFileSync('./cars_dataset.txt', 'utf-8')
  const document = new Document({ text: data })

  console.log('La primera vez tarda porque se descarga el modelo de Embedding de HuggingFace')
  const index = await VectorStoreIndex.fromDocuments([document], { serviceContext: serviceContext })
  console.log('Vectores generados')

  const promptTemplate = ({ context = "", query = "" }) => {
    return `Dato el siguiente contexto, responde a las siguientes preguntas
    ------------------------
    ${context}
    ------------------------
    pregunta: ${query}

    La respuesta debe ser en español y que cumpla con los siguientes criterios.

    1. Empeza con un saludo.
    2. Se breve y conciso.
    `
  }

  const responseSynthesizer = new ResponseSynthesizer({
    responseBuilder: new Refine(serviceContext, promptTemplate),
  })


  const queryEngine = index.asQueryEngine({ responseSynthesizer })
  console.log('preguntando')

  // Sin straming
  // const response = await queryEngine.query({
  //   query: 'Dame el precio del auto mas economico'
  // })
  // console.log(response.toString())


  //Con streaming de datos
  let respuesta = ''
  const stream = await queryEngine.query({ query: 'Dame el precio del auto mas barato', stream: true });
  for await (const chunk of stream) {
    console.log(chunk.response);
    respuesta += chunk.response
  }

  console.log(respuesta)


  // const responseSynthesizer = new ResponseSynthesizer({
  //   responseBuilder: new StreamingResponseBuilder(serviceContext, promptTemplate),
  // });
  // const responseStreaming = responseSynthesizer.stream(prompt);
  // for await (const chunk of responseStreaming) {
  //   console.log(chunk);
  // }







}

await codellama()