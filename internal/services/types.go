package services

type RoleDependentInfo struct {
	CollegiateNumber string `json:"collegiateNumber"`
	Specialty        string `json:"specialty"`
	StartDate        string `json:"startDate"`
	EndDate          string `json:"endDate"`
	DPI              string `json:"DPI"`
}

type User struct {
	Names             string            `json:"names"`
	LastNames         string            `json:"lastNames"`
	Phones            []string          `json:"phones"`
	Role              string            `json:"rol"`
	Mails             []string          `json:"mails"`
	RoleDependentInfo RoleDependentInfo `json:"roleDependentInfo"`
}
