package services

type RoleDependentInfo struct {
	Id               string `json:"id"`
	CollegiateNumber string `json:"collegiateNumber,omitempty"`
	Specialty        string `json:"specialty,omitempty"`
	StartDate        string `json:"startDate,omitempty"`
	EndDate          string `json:"endDate,omitempty"`
	DPI              string `json:"DPI,omitempty" validate:"numeric"`
}

type User struct {
	Id                string   `json:"id"`
	Names             string   `json:"names" validate:"required"`
	LastNames         string   `json:"lastNames" validate:"required"`
	Phones            []string `json:"phones" validate:"required"`
	Mails             []string `json:"mails" validate:"required"`
	Role              string   `json:"rol" validate:"required,oneof=Doctor Assistant Admin"`
	RoleDependentInfo RoleDependentInfo
}

type RecordFields struct {
	name string
}

type Record struct {
	id        string
	names     string
	lastNames string
	fields    []RecordFields
}
