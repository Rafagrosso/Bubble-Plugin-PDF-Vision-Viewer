try {
    instance.canvas.empty(); 
    instance.data.created = false;
} catch(e) {
    console.log("Erro ao limpar viewer:", e);
}
