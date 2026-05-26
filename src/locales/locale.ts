const zhCNModules = import.meta.glob('./langs/zh-CN/*.json', { eager: true });
const enUSModules = import.meta.glob('./langs/en-US/*.json', { eager: true });

const locales: Record<App.I18n.LangType, App.I18n.Schema> = {
  'zh-CN': getLangByModules(zhCNModules),
  'en-US': getLangByModules(enUSModules),
};

function getLangByModules(modules: any) {
  const moduleArr = Object.keys(modules);
  console.log('moduleArr', moduleArr)
  const langMsgObj = moduleArr.reduce((obj: any, key) => {
    const content = (modules[key] as any).default || {};
    obj = Object.assign(obj, content);
    return obj;
  }, {});
  return langMsgObj;
}
export default locales;
