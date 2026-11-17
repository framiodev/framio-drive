// Forum kaynaklari Mithril'i ve jQuery'yi global (m, $) olarak kullanir.
import m from 'mithril';
import jq from 'jquery';
// Flarum'un ipucu (tooltip) eklentisi bootstrap'a dayanir; burada gereksiz, bos birakilir.
jq.fn.tooltip = function () { return this; };
window.m = m;
window.$ = window.jQuery = jq;
export { m, jq as $ };
