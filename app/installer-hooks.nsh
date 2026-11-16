; Kurulum sonunda WinFsp (sanal surucu bileseni) yoksa sessizce kurar; kullanici ayri bir sey yapmaz.
!macro NSIS_HOOK_POSTINSTALL
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\WinFsp" "InstallDir"
  ${If} $0 == ""
    ReadRegStr $0 HKLM "SOFTWARE\WinFsp" "InstallDir"
  ${EndIf}
  ${If} $0 == ""
    DetailPrint "WinFsp kuruluyor..."
    IfFileExists "$INSTDIR\winfsp.msi" 0 +2
    ExecShellWait "runas" "msiexec.exe" '/i "$INSTDIR\winfsp.msi" /qn /norestart' SW_HIDE
  ${EndIf}
!macroend
