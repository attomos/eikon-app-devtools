export default function () {
  return window.location.hostname === 'localhost' ? 'http://emea.apps.cp.thomsonreuters.com' : '';
}
