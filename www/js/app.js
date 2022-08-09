// VARIABLES GLOBALES
var price;
var id;
var map;

//API KEY PARA LA COTIZACION DEL DOLAR
let API_KEY_EXCHANGE = "69d35e6a3be5eb07f609c2fe";

//URL's
const url = `https://crypto.develotion.com`;
const urlLogin = `${url}/login.php`;
const urlSignUp = `${url}/usuarios.php`;
const urlDepartments = `${url}/departamentos.php`;
const urlCityForDepartment = `${url}/ciudades.php?idDepartamento=`;
const urlCoins = `${url}/monedas.php`;
const urlAddTransaction = `${url}/transacciones.php`;
const urlTransactions = `${url}/transacciones.php?idUsuario=`;
const urlUsersByDepartment = `${url}/usuariosPorDepartamento.php`;

async function close_app(){
  const alerta = await alertController.create({
      header: 'CrypotOrt',
      subHeader:'Cerrar App',
      message: '¿Seguro que desea cerrar app?',
      buttons: [
          {
            text: 'SI',
            handler: function(){
              // puedo ejecutar cualquier código.
              if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('App')) {
                  Capacitor.Plugins.App.exitApp();
              } 
            }
          },
          {
            text: 'NO',
          }
        ]
      });
  await alerta.present();
}

async function obtenerConexionInternet(){
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Network')) {
      return await Capacitor.Plugins.Network.getStatus();
  }
  else{
      throw 'Network no disponible';
  }
}

//DISPLAY TOAST
display_toast = (message, header, color) => {
  const toast = document.createElement("ion-toast");
  (toast.header = header),
    (toast.icon = "information-circle"),
    (toast.position = "top"),
    (toast.message = message),
    (toast.duration = 2000),
    (toast.color = color),
    document.body.appendChild(toast);
  toast.present();
};

//MUESTRA EL MENSAJE DE "CARGANDO..."
async function cargando(message) {
  const loading = await loadingController.create({
    message: message,
  });
  return await loading;
}

//ALERT PARA CUANDO EL USUARIO REALIZA UNA TRANSACCION
async function presentAlert(message) {
  const alert = document.createElement("ion-alert");
  alert.message = message;
  alert.buttons = ["OK"];
  document.body.appendChild(alert);
  await alert.present();
}

//ALERT PARA CUANDO EL USUARIO QUIERE CERRAR SESION
async function logout(router) {
  const alert = document.createElement("ion-alert");
  alert.header = "CERRAR SESION"
  alert.subHeader = "Estas seguro de querer cerrar sesion?";
  alert.buttons = [
    {
      text: 'CANCELAR',
      role: 'cancel',
    },
    {
      text: 'OK',
      role: 'confirm',
      handler: () => {
        erase_data_user();
        router.push("/");
      }
    },
  ];
  document.body.appendChild(alert);
  await alert.present();
  const {role} = await alert.onDidDismiss();
}

//CUANDO EL USUARIO SE LOGUEA GUARDA SUS CREDENCIALES
login = (data, router) => {
  localStorage.setItem("apiKey", data.apiKey);
  localStorage.setItem("userId", data.id);
  router.push("/coins");
};

//CUANDO EL USUARIO CIERRA SESION SE BORRAN SUS CREDENCIALES
erase_data_user = () => {
  localStorage.setItem("apiKey", "");
  localStorage.setItem("userId", "");
}

//OBTIENE LOS PARAMETROS DE LA URL
getParam = (name, url = window.location.href) => {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

//OBTIENE TODAS LAS MONEDAS Y DEPENDIENDO
//DEL PARAMETRO OPTION PASADO REDIRIGE A UNA FUNCION DISTINTA
get_coins = (option) => {
  cargando("Cargando Monedas...").then((loading) => {
    loading.present();

    let apiKey = localStorage.getItem("apiKey");

    fetch(urlCoins, {
      headers: {
        "Content-type": "application/json",
        apikey: apiKey,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        switch (option) {
          case 1:
            list_coins(data);
            break;
          case 2:
            info_coin(data);
            break;
          default:
            load_select_cryptos(data);
            break;
        }
      })
      .catch((err) => display_toast(err, "Info", "danger"))
      .finally(() => loading.dismiss());
  });
};

//LISTA TODASS LAS CRYPTOS
list_coins = (data) => {
  let list = document.getElementById("list_coins");
  let item = "";

  for (let coin of data.monedas) {
    item = `<ion-item href="/detailcoin?id=${coin.id}" detail>
            <ion-avatar slot="start">
                <img src="https://crypto.develotion.com/imgs/${coin.imagen}" />
            </ion-avatar>
            <ion-label>
                <h1>${coin.nombre}</h1>
                <h1>U$S ${coin.cotizacion}</h1>
            </ion-label>
            </ion-item>`;
    list.innerHTML += item;
  }
};

//MUESTRA LA INFORMACION DE LA CRYPTO SELECCIONADA
info_coin = (data) => {
  const coin_id = getParam("id");
  let item = document.getElementById("coin_card");

  for (let coin of data.monedas) {
    if (coin.id == coin_id) {
      //GUARDO LA COTIZACION Y EL ID DE LA CRYPTO EN VARIABLES
      //GLOBALES PARA USUARLAS SI EL USUARIO DECIDE HACER UNA TRANSACCION
      price = coin.cotizacion;
      id = coin.id;
      item.innerHTML = `<ion-card-header>
                          <ion-card-title id="coin_name" color="dark"><h1>${(coin.nombre).toUpperCase()}</h1></ion-card-title>
                        </ion-card-header>
                        <img src="https://crypto.develotion.com/imgs/${coin.imagen}" class="ion-padding" width="100px"/>
                        <ion-card-content>
                          <h1 id="coin_price">U$S ${coin.cotizacion}</h1> 
                        </ion-card-content>`;
    }
  }
};

//MUESTRA TODAS LAS TRANSACCIONES REALIZADAS POR EL USUARIO
info_transactions = (data) => {
  let lista = document.getElementById("list_transactions");
  let apiKey = localStorage.getItem("apiKey");
  let item = "";

  if (data.transacciones.length != 0) {
    //MUESTRA TODAS SUS TRANSACCIONES
    for (let t of data.transacciones) {
      fetch(urlCoins, {
        headers: {
          "Content-type": "application/json",
          apikey: apiKey,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          for (let coin of data.monedas) {
            if (coin.id == t.moneda) {
              item = `<ion-item>
                        <ion-avatar slot="start">
                          <img src="https://crypto.develotion.com/imgs/crypto${t.moneda}.png" />
                        </ion-avatar>
                        <ion-label>
                          <h1>${coin.nombre.toUpperCase()}</h1>
                          <h1 slot="end" color="success">U$S ${t.valor_actual}</h1>
                          ${t.tipo_operacion == 1 
                            ? 
                            `<ion-badge color="success">COMPRA</ion-badge>` : 
                            `<ion-badge color="danger">VENTA</ion-badge>`}
                        </ion-label>
                        </ion-item>`;
              lista.innerHTML += item;
            }
          }
        })
        .catch((err) => display_toast(err, "Info", "danger"));
    }
  } else {
    lista.innerHTML = `<ion-label><h1>SIN TRANSACCIONES REALIZADAS</h1></ion-label>`;
  }
};

//FILTRA LAS TRANSACCIONES POR CRYPTO
info_transactions_filter = (data, crypto) => {
  let lista = document.getElementById("list_transactions");
  let item;

  for (let c of data.transacciones) {
    if (c.moneda == crypto) {
      item = `<ion-item>
      <ion-label>
      <h1 slot="end" color="success">U$S ${c.valor_actual} | ${c.cantidad} Unidades</h1>
      ${c.tipo_operacion == 1 
        ? 
        `<ion-badge color="success">COMPRA</ion-badge>` : 
        `<ion-badge color="danger">VENTA</ion-badge>`}
      </ion-label>
      </ion-item>`;
      lista.innerHTML += item;
    }
  }

  if (lista.childNodes.length == 0 && crypto !== "") {
    item = `<ion-item>
              <p>No tienes transacciones realizadas con esa crypto</p>
            </ion-item>`;
    lista.innerHTML += item;
  }
};

//CARGA EL SELECT DE CRYPTOS
load_select_cryptos = (data) => {
  let selectCryptos = document.getElementById("select_cryptos");
  selectCryptos.innerHTML = "";

  for (let d of data.monedas) {
    let option = `<ion-select-option value="${d.id}">${(d.nombre).toUpperCase()}</ion-select-option>`;
    selectCryptos.innerHTML += option;
  }
};

//CALCULA Y MUESTRA LOS MONTOS INVERTIDOS POR CADA CRYPTO
amount_invested_by_currency = (data) => {
  let amountCurrencyById = {};
  let apiKey = localStorage.getItem("apiKey");
  let lista = document.getElementById("amount_currency_by_coin");
  let item;

  for (let c of data.transacciones) {
    if (c.tipo_operacion == 1) {
      amountCurrencyById[c.moneda]
        ? (amountCurrencyById[c.moneda] += c.cantidad * c.valor_actual)
        : (amountCurrencyById[c.moneda] = c.cantidad * c.valor_actual);
    }
  }

  fetch(urlCoins, {
    headers: {
      "Content-type": "application/json",
      apikey: apiKey,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      for (let coin of data.monedas) {
        if (amountCurrencyById[coin.id]) {
          item = `<ion-item>
            <ion-avatar slot="start">
            <img src="https://crypto.develotion.com/imgs/crypto${coin.id}.png" />
            </ion-avatar>
            <ion-label>
              <h1>${coin.nombre.toUpperCase()}</h1>
              <h1>U$S ${amountCurrencyById[coin.id]}</h1>
            </ion-label>
            </ion-item>`;
          lista.innerHTML += item;
        } else {
          item = `<ion-item>
          <ion-avatar slot="start">
          <img src="https://crypto.develotion.com/imgs/crypto${coin.id}.png" />
          </ion-avatar>
          <ion-label>
            <h1>${coin.nombre.toUpperCase()}</h1>
            <h1>U$S 0 Invertidos</h1>
          </ion-label>
          </ion-item>`;
          lista.innerHTML += item;
        }
      }
    })
    .catch((err) => display_toast(err, "Info", "danger"));
};

show_total_invest = (uy, purchases, sales) => {
  let total_invest_uy = (Math.round(purchases) - Math.round(sales)) * Math.round(uy);
  document.getElementById("dolar_today").innerHTML = `U$S 1 = $ ${Math.round(uy)}`;
  document.getElementById("total_purchases").innerHTML = `U$S ${Math.round(purchases)}`;
  document.getElementById("total_sales").innerHTML = `U$S ${Math.round(sales)}`;
  document.getElementById("total_invest").innerHTML = `$ ${Math.round(total_invest_uy)}`;
};

total_amount_invest = (data) => {
  let total_purchases = 0;
  let total_sales = 0;

  for (let t of data.transacciones) {
    t.tipo_operacion == 1
      ? (total_purchases += t.valor_actual * t.cantidad)
      : (total_sales += t.valor_actual * t.cantidad);
  }

  fetch(`https://v6.exchangerate-api.com/v6/${API_KEY_EXCHANGE}/latest/USD`)
    .then((res) => res.json())
    .then((data) =>
      show_total_invest(data.conversion_rates.UYU, total_purchases, total_sales)
    );
};

get_transactions = (option) => {
  cargando("Cargando Transacciones...").then((loading) => {
    loading.present();
    let user_id = localStorage.getItem("userId");
    let api_key = localStorage.getItem("apiKey");

    fetch(urlTransactions + `${user_id}`, {
      headers: {
        "Content-type": "application/json",
        apikey: api_key,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        switch (option) {
          case 1:
            info_transactions(data);
            break;
          case 2:
            total_amount_invest(data);
            break;
          default:
            amount_invested_by_currency(data);
            break;
        }
      })
      .catch((err) => display_toast(err, "Info", "danger"))
      .finally(() => loading.dismiss());
  });
};

//COLOCA LOS MARCADORES EN EL MAPA
//CON LA CANTIDAD DE USUARIOS QUE HAY POR DEPARTAMENTO
var put_markers = async function (data) {
  for (let dep of data.departamentos) {
    
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?&country=Uruguay&format=json&state=" +
        `${dep.nombre}`
    );
    const data = await res.json();

    L.marker([data[0].lat, data[0].lon])

      .bindPopup(
        `<strong>${dep.nombre}</strong><br/>${dep.cantidad_de_usuarios} usuarios`,
        {
          closeButton: false,
        }
      )
      .openPopup()
      .addTo(map);
  }
};

//MUESTRA EL MAPA
show_map = () => {
  let api_key = localStorage.getItem("apiKey");

  if (map != undefined) {
    map.remove();
  }

  map = L.map("map", {
    maxZoom: 7,
  }).setView([-32.77622872001672, -56.09500352069175], 20);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  fetch(urlUsersByDepartment, {
    headers: {
      "Content-type": "application/json",
      apikey: api_key,
    },
  })
    .then((res) => res.json())
    .then((data) => put_markers(data))
    .catch((err) => display_toast(err, "Info", "danger"));
};

// AL CARGAR LA APP
document.addEventListener("DOMContentLoaded", function () {
  let router = document.querySelector("ion-router");

  router.addEventListener("ionRouteDidChange", function (e) {
    
    document.getElementById("menu_lateral").close();
    let nav = e.detail;
    let paginas = document.getElementsByTagName("ion-page");
    for (let i = 0; i < paginas.length; i++) {
      paginas[i].style.visibility = "hidden";
    }
    let ion_route = document.querySelectorAll(`[url="${nav.to}"]`);
    let id_pagina = ion_route[0].getAttribute("component");
    let pagina = document.getElementById(id_pagina);
    pagina.style.visibility = "visible";

    if (nav.to == "/coins") {

      document.getElementById("list_coins").innerHTML = "";
      get_coins(1);
    }
    if (nav.to == "/detailcoin") {
      get_coins(2);
    }
    if (nav.to == "/transactions") {
      document.getElementById("list_transactions").innerHTML = "";
      document.getElementById("select_cryptos").value = "";
      get_transactions(1);
      get_coins(3);
    }
    if (nav.to == "/map") {
      show_map();
    }
    if (nav.to == "/totalinvest") {
      get_transactions(2);
    }
    if (nav.to == "/investbycurrency") {
      get_transactions(3);
    }
  });

  obtenerConexionInternet().then((estatus) => {
    if('none' == estatus.connectionType){
        display_toast('Info', 'Sin Internet', 'primary');
    }
    else{
        display_toast('INFO',`Tienes conexion en tu ${estatus.connectionType}`,'primary')
    }
    }).catch(error => display_toast('Warning',error,'danger'));

    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Network')) {
      Capacitor.Plugins.Network.addListener('networkStatusChange', status => {
        if('none' == status.connectionType){
            if(Capacitor.isPluginAvailable('Haptics')){
                vibrar();     
            }
            display_toast('ADVERTENCIA', 'NO TIENES INTERNET','danger');
        }
        else{
            display_toast('INFO','CONECTADO A INTERNET','primary')
        }
    });
} 

  //OBTIENE TODOS LOS DEPARTAMENTOS
  get_departments = () => {
    fetch(urlDepartments, {
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => load_select_departments(data))
      .catch((err) => display_toast(err, "Info", "danger"));
  };

  //CARGA UN SELECT CON TODOS LOS DEPARTAMENTOS
  load_select_departments = (data) => {
    let selectDepartments = document.getElementById("select_departments");
    selectDepartments.innerHTML = "";

    for (let d of data.departamentos) {
      let option = `<ion-select-option value="${d.id}">${d.nombre}</ion-select-option>`;
      selectDepartments.innerHTML += option;
    }
  };

  //CUANDO EL USUARIO ELIGE UN DEPARTAMENTO, SE OBTIENE EL CODIGO DEL MISMO
  //Y SE HACE UNA PETICION A LA API DE LAS CIUDADES CON ESE CODIGO.
  document
    .getElementById("select_departments")
    .addEventListener("ionChange", function () {
      let code_department = document.getElementById("select_departments").value;
      document.getElementById("select_citys").value = "";

      fetch(urlCityForDepartment + `${code_department}`, {
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => load_select_citys(data))
        .catch((err) => display_toast(err, "Info", "danger"));
    });

  load_select_citys = (data) => {
    let selectCitys = document.getElementById("select_citys");
    selectCitys.innerHTML = "";

    for (let d of data.ciudades) {
      let option = `<ion-select-option value="${d.id}">${d.nombre}</ion-select-option>`;
      selectCitys.innerHTML += option;
    }
  };

  document
    .getElementById("select_cryptos")
    .addEventListener("ionChange", function () {
      cargando("Cargando Crypto...").then((loading) => {
        loading.present();
        let crypto = document.getElementById("select_cryptos").value;
        let user_id = localStorage.getItem("userId");
        let api_key = localStorage.getItem("apiKey");

        //Vacia la lista de transacciones para insertar solo la crypto seleccionada
        document.getElementById("list_transactions").innerHTML = "";

        fetch(urlTransactions + `${user_id}`, {
          headers: {
            "Content-type": "application/json",
            apikey: api_key,
          },
        })
          .then((res) => res.json())
          .then((data) => info_transactions_filter(data, crypto))
          .catch((err) => display_toast(err, "Info", "danger"))
          .finally(() => loading.dismiss());
      });
    });

  // LOGIN
  document.getElementById("btn_login").onclick = () => {
    const user = document.getElementById("input_user").value;
    const pass = document.getElementById("input_password").value;

    try {
      //Validaciones
      if (!user) throw "Usuario Requerido!";
      if (!pass) throw "Password Requerido!";

      //Invocacion API de Login de usuario
      fetch(urlLogin, {
        method: "POST",
        body: JSON.stringify({
          usuario: user,
          password: pass,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((res) =>
          res.ok
            ? res.json()
            : res.json().then((data) => Promise.reject(data.mensaje))
        )
        .then((data) => login(data, router))
        .catch((mensaje) => display_toast(mensaje, "NO AUTORIZADO", "danger"));
    } catch (err) {
      display_toast(err, "Advertencia", "danger");
    }
  };

  // REGISTRO
  document.getElementById("btn_signup").onclick = () => {
    const user = document.getElementById("input_user_signup").value;
    const department = Number(
      document.getElementById("select_departments").value
    );
    const city = Number(document.getElementById("select_citys").value);
    const pass = document.getElementById("input_password_signup").value;
    const re_pass = document.getElementById("input_repassword_signup").value;

    try {
      if (!user) throw "Usuario requerido!";
      if (!department) throw "Departamento requerido!";
      if (!city) throw "Ciudad Requerida!";
      if (!pass) throw "Password Requerido !";
      if (!re_pass) throw "Confirmacion de password requerida!";
      if (pass !== re_pass) throw "Los password no coinciden!";

      const datos = {
        usuario: user,
        password: pass,
        idDepartamento: department,
        idCiudad: city,
      };

      fetch(urlSignUp, {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((res) =>
          res.ok
            ? res.json()
            : res.json().then((data) => Promise.reject(data.mensaje))
        )
        .then((data) => router.push("/"))
        .catch((mensaje) => display_toast(mensaje, "NO AUTORIZADO", "danger"));
    } catch (err) {
      display_toast(err, "Advertencia", "danger");
    }
  };

  //REALIZAR OPERACION
  document.getElementById("btn_operation").onclick = () => {
    let type = document.getElementById("type_transaction").value;
    let quantity = document.getElementById("input_quantity").value;
    let apiKey = localStorage.getItem("apiKey");

    try {
      if (!type) throw "Ingresar tipo de operacion!";
      if (!quantity) throw "Ingresar cantidad!";

      const datos = {
        idUsuario: localStorage.getItem("userId"),
        tipoOperacion: type,
        moneda: id, //id y price son variables globales definidas al principio del codigo.
        cantidad: quantity,
        valorActual: price,
      };

      fetch(urlAddTransaction, {
        method: "POST",
        body: JSON.stringify(datos),
        headers: {
          "Content-type": "application/json",
          apikey: apiKey,
        },
      })
        .then((res) =>
          res.ok ? res.json() : res.json().then((data) => Promise.reject(data))
        )
        .then((data) => {
          router.push("/coins");
          presentAlert("TRANSACCION REALIZADA CON EXITO");
        })
        .catch((mensaje) => display_toast(mensaje, "Info", "danger"));
    } catch (err) {
      display_toast(err, "Advertencia", "danger");
    }
  };

  // LOGOUT
  document.getElementById('logout').onclick = () => {
    logout(router);
  }

  //CLOSE APP
  document.getElementById('close_app').onclick = () => {
    close_app();
  }

  get_departments();
});
