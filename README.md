
```
hotel-pipa
├─ .firebase
│  └─ hosting.ZGlzdA.cache
├─ .firebaserc
├─ eslint.config.js
├─ firebase.json
├─ firestore.indexes.json
├─ firestore.rules
├─ functions
│  ├─ index.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  └─ index.ts
│  └─ tsconfig.json
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ favicon.png
│  ├─ favicon.svg
│  └─ icons.svg
├─ README.md
├─ scripts
│  ├─ migrateUsersToAuth.ts
│  └─ seedTours.ts
├─ settings.json
├─ src
│  ├─ assets
│  │  ├─ hero.png
│  │  └─ vite.svg
│  ├─ components
│  │  ├─ AdminRoute.tsx
│  │  ├─ apartment
│  │  │  ├─ ApartmentActions.tsx
│  │  │  ├─ ApartmentGuestInfo.tsx
│  │  │  ├─ ApartmentHeader.tsx
│  │  │  ├─ ApartmentItemsControl.tsx
│  │  │  ├─ CheckinModal.tsx
│  │  │  ├─ CheckoutModal.tsx
│  │  │  ├─ EditPhoneModal.tsx
│  │  │  ├─ LanguageSelectionModal.tsx
│  │  │  ├─ TermDocument.tsx
│  │  │  ├─ TermSignatureModal.tsx
│  │  │  └─ TowelSignatureModal.tsx
│  │  ├─ ApartmentCard.tsx
│  │  ├─ ApartmentHistoryModal.tsx
│  │  ├─ Button.tsx
│  │  ├─ ChangePasswordModal.tsx
│  │  ├─ commissions
│  │  │  ├─ AgencyManager.tsx
│  │  │  ├─ AgencyReportModal.tsx
│  │  │  ├─ CommissionCharts.tsx
│  │  │  ├─ ConfirmModal.tsx
│  │  │  ├─ DashboardHeader.tsx
│  │  │  ├─ GlobalCommissionCard.tsx
│  │  │  ├─ GlobalFilters.tsx
│  │  │  ├─ Pagination.tsx
│  │  │  ├─ PaymentModal.tsx
│  │  │  ├─ PeriodControl.tsx
│  │  │  ├─ PromotionFormModal.tsx
│  │  │  ├─ PromotionsList.tsx
│  │  │  ├─ RichTextEditor.tsx
│  │  │  ├─ SalesRegister.tsx
│  │  │  ├─ SalesTable.tsx
│  │  │  ├─ SendTourPromoModal.tsx
│  │  │  ├─ StatsCards.tsx
│  │  │  ├─ TableFilters.tsx
│  │  │  ├─ TourDetailModal.tsx
│  │  │  ├─ TourFormModal.tsx
│  │  │  ├─ TourGalleryManager.tsx
│  │  │  ├─ ToursTable.tsx
│  │  │  └─ VendorRanking.tsx
│  │  ├─ Footer.tsx
│  │  ├─ guestGuide
│  │  │  ├─ CopyButton.tsx
│  │  │  ├─ ErrorScreen.tsx
│  │  │  ├─ GuestHeader.tsx
│  │  │  ├─ GuideCard.tsx
│  │  │  ├─ HeroHeader.tsx
│  │  │  ├─ icons
│  │  │  │  └─ index.tsx
│  │  │  ├─ index.ts
│  │  │  ├─ LinkCard.tsx
│  │  │  ├─ LoadingScreen.tsx
│  │  │  ├─ NavigationMenu.tsx
│  │  │  ├─ PDFCard.tsx
│  │  │  ├─ PDFViewerModal.tsx
│  │  │  ├─ PlacesMapModal.tsx
│  │  │  ├─ ScheduleItem.tsx
│  │  │  └─ TaxiSection.tsx
│  │  ├─ Layout.tsx
│  │  ├─ LossesPanel.tsx
│  │  ├─ lostAndFound
│  │  │  ├─ BatchLabelPrint.tsx
│  │  │  ├─ ImageGallery.tsx
│  │  │  ├─ ItemImage.tsx
│  │  │  ├─ Lostandfoundstats.tsx
│  │  │  ├─ LostItemFilters.tsx
│  │  │  ├─ LostItemForm.tsx
│  │  │  ├─ LostItemLabel.tsx
│  │  │  ├─ LostItemModal.tsx
│  │  │  ├─ LostItemsTable.tsx
│  │  │  ├─ StatusBadge.tsx
│  │  │  └─ WhatsAppButton.tsx
│  │  ├─ ProtectedRoute.tsx
│  │  ├─ serviceOrders
│  │  │  ├─ OSCharts.tsx
│  │  │  ├─ OSDetailModal.tsx
│  │  │  ├─ OSFilters.tsx
│  │  │  ├─ OSFormModal.tsx
│  │  │  ├─ OSImageGenerator.tsx
│  │  │  ├─ OSKanbanBoard.tsx
│  │  │  ├─ OSKanbanCard.tsx
│  │  │  ├─ OSMetrics.tsx
│  │  │  ├─ OSNotificationContainer.tsx
│  │  │  ├─ OSNotificationToast.tsx
│  │  │  ├─ OSQuickActions.tsx
│  │  │  ├─ OSStatusBadge.tsx
│  │  │  └─ OSTable.tsx
│  │  ├─ TabuaMare
│  │  │  ├─ SendTideModal.tsx
│  │  │  ├─ TabuaMareWidget.tsx
│  │  │  └─ TideWidgetPremium.tsx
│  │  ├─ TaxiNotification.tsx
│  │  ├─ Toast.tsx
│  │  └─ UserMenu.tsx
│  ├─ contexts
│  │  ├─ AuthContext.tsx
│  │  ├─ CommissionContext.tsx
│  │  ├─ LostAndFoundContext.tsx
│  │  ├─ OSContext.tsx
│  │  ├─ PaymentContext.tsx
│  │  └─ ThemeContext.tsx
│  ├─ hooks
│  │  ├─ useApartmentActions.ts
│  │  ├─ useApartments.ts
│  │  ├─ useFirestore.ts
│  │  ├─ useGuestGuide.ts
│  │  ├─ useLostAndFound.ts
│  │  ├─ useNavigation.ts
│  │  ├─ usePermission.ts
│  │  ├─ useServiceOrders.ts
│  │  ├─ useTabuaMare.ts
│  │  ├─ useTermPDF.ts
│  │  ├─ useToast.tsx
│  │  └─ useTowelValidation.ts
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ AdminGuestGuidePage.tsx
│  │  ├─ AdminUsersPage.tsx
│  │  ├─ ApartmentsPage.tsx
│  │  ├─ commissions
│  │  │  ├─ CommissionDashboard.tsx
│  │  │  ├─ CommissionSettings.tsx
│  │  │  ├─ CommissionsPage.tsx
│  │  │  ├─ MyCommissions.tsx
│  │  │  └─ RegisterSalePage.tsx
│  │  ├─ DashboardPage.tsx
│  │  ├─ DocumentsPage.tsx
│  │  ├─ LoginPage.tsx
│  │  ├─ LogPage.tsx
│  │  ├─ lostAndFound
│  │  │  ├─ LostAndFoundLayout.tsx
│  │  │  ├─ LostAndFoundListPage.tsx
│  │  │  ├─ LostAndFoundReportsPage.tsx
│  │  │  └─ LostAndFoundScanPage.tsx
│  │  ├─ LostAndFoundPage.tsx
│  │  ├─ PublicGuestGuidePage.tsx
│  │  ├─ PublicOSPage.tsx
│  │  ├─ PublicTermSignaturePage.tsx
│  │  ├─ PublicTourPage.tsx
│  │  ├─ PublicToursPage.tsx
│  │  ├─ PublicTowelSignaturePage.tsx
│  │  ├─ ReceiptsPage.tsx
│  │  ├─ serviceOrders
│  │  │  ├─ ServiceOrderDashboard.tsx
│  │  │  ├─ ServiceOrderKanban.tsx
│  │  │  ├─ ServiceOrderReports.tsx
│  │  │  └─ ServiceOrdersPage.tsx
│  │  ├─ SetAdminPage.tsx
│  │  ├─ TabuaDeMarePage.tsx
│  │  └─ TermSignaturesPage.tsx
│  ├─ routes
│  │  └─ index.tsx
│  ├─ services
│  │  ├─ apartmentService.ts
│  │  ├─ auditService.ts
│  │  ├─ authService.ts
│  │  ├─ communicationTourService.ts
│  │  ├─ firebase.ts
│  │  ├─ guestGuideService.ts
│  │  ├─ lostAndFoundService.ts
│  │  ├─ seedService.ts
│  │  ├─ serviceOrderService.ts
│  │  ├─ storageService.ts
│  │  ├─ tabuaMareService.ts
│  │  ├─ taxiService.ts
│  │  ├─ termService.ts
│  │  └─ towelService.ts
│  ├─ styles
│  │  └─ index.css
│  ├─ types
│  │  ├─ commission.types.ts
│  │  ├─ guestGuide.types.ts
│  │  ├─ html5-qrcode.d.ts
│  │  ├─ index.ts
│  │  ├─ lostAndFound.types.ts
│  │  ├─ serviceOrder.types.ts
│  │  └─ tabuaMare.types.ts
│  └─ utils
│     ├─ commissionCalculations.ts
│     ├─ formatHelpers.ts
│     ├─ guideTranslations.ts
│     ├─ osHelpers.ts
│     ├─ phoneFormatter.ts
│     ├─ soundPlayer.ts
│     ├─ tideMessageFormatter.ts
│     └─ whatsappMessages.ts
├─ storage.rules
├─ tailwind.config.js
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vercel.json
└─ vite.config.ts

```