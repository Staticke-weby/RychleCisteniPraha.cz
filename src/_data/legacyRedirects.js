// Redirecty původních Google Sites URL na nové cesty.
// Používá se jako statické HTML přesměrování (meta refresh + JS), protože
// GitHub Pages neumí .htaccess. Na FTP/Apache se navíc uplatní 301 z .htaccess.
//
// "from" musí končit lomítkem (vygeneruje se <from>index.html).
// "to" je interní cesta (root-relative), doplní se automaticky base path.
export default [
  { from: "RychleCisteniPraha/", to: "/" },
];
