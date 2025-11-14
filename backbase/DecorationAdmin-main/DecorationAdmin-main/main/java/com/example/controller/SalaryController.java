package com.example.controller;


import com.example.common.Result;
import com.example.entity.CustomerRep;
import com.example.entity.Salary;
import com.example.exception.CustomException;
import com.example.service.SalaryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.lang.reflect.Type;

@RestController
@RequestMapping("/api/Salary")
public class SalaryController {
    @Resource
    private SalaryService salaryService;

    @GetMapping("/generate")
    public Result<Salary> generate(@RequestParam(required=false,defaultValue = "") String id,
                                   @RequestParam(value ="date", required = false, defaultValue = "1") String date)
    {
        long l=Long.parseLong(id);
        Salary one=salaryService.generate(l,date);
        System.out.println((date.getClass().getSimpleName()));
        return Result.success(salaryService.generate(l,date));
    }
}
