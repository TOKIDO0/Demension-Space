package com.example.service;

import com.example.entity.Materialpurchase;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.MaterialpurchaseMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class MaterialpurchaseService extends ServiceImpl<MaterialpurchaseMapper, Materialpurchase> {

    @Resource
    private MaterialpurchaseMapper materialpurchaseMapper;

}
