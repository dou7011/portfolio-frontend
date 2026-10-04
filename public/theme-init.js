(function () {
  try {
    var savedTheme = localStorage.getItem('portfolio-theme');
    var isDark = savedTheme === 'dark' || savedTheme === null;
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  } catch (error) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
