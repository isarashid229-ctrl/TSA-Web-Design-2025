(function(){
  function submitForm(e){
    e.preventDefault();
    const form = e.target;
    form.reset();
    const thanks = document.getElementById('thanks');
    if (thanks) thanks.style.display = 'block';
  }
  document.getElementById('suggest')?.addEventListener('submit', submitForm);
})();
