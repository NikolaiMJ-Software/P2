//switch function//

const switchTheme = () => { 
    //get root element and data-theme value//
    const rootElem = document.documentElement;
    let dataTheme = rootElem.getAttribute('data-theme');

    let newTheme = (dataTheme === 'light') ? 'dark' : 'light';

    //set the new HTML attribute//
    rootElem.setAttribute('data-theme', newTheme);
          

    //set the new local storage item//
    localStorage.setItem('theme', newTheme);

}

//add event listener to the switcher//
document.querySelector('#theme-switcher').addEventListener('click', switchTheme);


    //check local storage//
    let localS = localStorage.getItem("theme"),
        themeToSet = localS;

    //if local storage is not set, we check the OS preference//
    if (!localS === 'dark') {
        themeToSet = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    }

    //set the correct theme//
    document.documentElement.setAttribute('data-theme', themeToSet); 